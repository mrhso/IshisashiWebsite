// 东方萃梦想 DAT 解析
'use strict';

const parseDAT = (buf) => {
    let count = buf.readUInt16LE();
    // 考虑到需要解密所以复制一份
    let fileInfo = Buffer.from(buf.slice(2, count * 108 + 2));

    let offset = 0;
    let k = 100;
    let t = 100;
    while (offset < fileInfo.length) {
        fileInfo[offset] ^= k;
        k += t;
        k %= 256;
        t += 77;
        t %= 256;
        offset += 1;
    };

    let chunks = [];
    offset = 0;
    while (offset < fileInfo.length) {
        let name = fileInfo.slice(offset, offset + 100).toString().split('\0')[0];
        // 未知
        offset += 100;
        let size = fileInfo.readUInt32LE(offset);
        offset += 4;
        let start = fileInfo.readUInt32LE(offset);
        let end = start + size;
        let data = buf.slice(start, end);
        offset += 4;
        let chunk = { name, data };
        chunks.push(chunk);
    };

    return chunks;
};

module.exports = {
    parseDAT,
};
