// 秋霜玉 DAT 解析
'use strict';

const parseDAT = (buf) => {
    let output = {};
    let magic = buf.slice(0, 4).toString();
    if (magic !== 'PBG\u{001A}') {
        throw '档案非秋霜玉 DAT';
    };
    // 魔数后面的四个位元组并不清楚
    let unknown = buf.readUInt32LE(4);
    output.unknown = unknown;
    let count = buf.readUInt32LE(8);
    let fileInfo = buf.slice(12, count * 12 + 12);
    let chunks = [];
    let offset = 0;
    while (offset < fileInfo.length) {
        let chunk = {};
        let size = fileInfo.readUInt32LE(offset);
        chunk.size = size;
        offset += 4;
        let start = fileInfo.readUInt32LE(offset);
        let end = offset + 8 === fileInfo.length ? buf.length : fileInfo.readUInt32LE(offset + 12);
        chunk.data = buf.slice(start, end);
        offset += 4;
        // 校验码应当在写入时计算
        let checksum = fileInfo.readUInt32LE(offset);
        offset += 4;
        chunks.push(chunk);
    };
    output.chunks = chunks;
    return output;
};

const getChecksum = (buf) => {
    let checksum = 0;
    for (let b of buf) {
        checksum += b;
    };
    return checksum;
};

const writeDAT = (obj) => {
    let output = [Buffer.from('PBG\u{001A}')];
    let unknown = Buffer.alloc(4);
    unknown.writeUInt32LE(obj.unknown);
    output.push(unknown);
    let count = Buffer.alloc(4);
    count.writeUInt32LE(obj.chunks.length);
    output.push(count);
    let fileInfo = Buffer.alloc(obj.chunks.length * 12);
    let chunks = [];
    let start = obj.chunks.length * 12 + 12;
    let offset = 0;
    for (let chunk of obj.chunks) {
        fileInfo.writeUInt32LE(chunk.size, offset);
        offset += 4;
        fileInfo.writeUInt32LE(start, offset);
        chunks.push(chunk.data);
        start += chunk.data.length;
        offset += 4;
        let checksum = getChecksum(chunk.data);
        fileInfo.writeUInt32LE(checksum, offset);
        offset += 4;
    };
    output = Buffer.concat([...output, fileInfo, ...chunks]);
    return output;
};

module.exports = {
    parseDAT,
    writeDAT,
};
