// 秋霜玉 DAT 解析
'use strict';

const parseDAT = (buf) => {
    let magic = buf.slice(0, 4).toString();
    if (magic !== 'PBG\u{001A}') {
        throw '档案非秋霜玉 DAT';
    };
    // 整个 DAT 的校验码
    let checksumAll = buf.readUInt32LE(4);
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
        // 单个档案的校验码
        let checksum = fileInfo.readUInt32LE(offset);
        offset += 4;
        chunks.push(chunk);
    };
    return chunks;
};

const getChecksum = (buf) => {
    let checksum = 0;
    for (let b of buf) {
        checksum += b;
    };
    return checksum;
};

const writeDAT = (arr) => {
    let output = [Buffer.from('PBG\u{001A}')];
    let checksumAll = Buffer.alloc(4);
    output.push(checksumAll);
    let count = Buffer.alloc(4);
    count.writeUInt32LE(arr.length);
    output.push(count);
    let fileInfo = Buffer.alloc(arr.length * 12);
    let chunks = [];
    let start = arr.length * 12 + 12;
    let offset = 0;
    for (let chunk of arr) {
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
    // 你以为完了？不，还没有
    offset = 0;
    let csAll = 0;
    while (offset < fileInfo.length) {
        csAll += fileInfo.readUInt32LE(offset);
        offset += 4;
    };
    checksumAll.writeUInt32LE(csAll);
    output = Buffer.concat([...output, fileInfo, ...chunks]);
    return output;
};

module.exports = {
    parseDAT,
    writeDAT,
};
