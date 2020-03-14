// 统一的 WAVE 处理器
'use strict';

const parseChunks = (buf) => {
    let chunks = { order: [] };
    let offset = 0;
    while (offset < buf.length) {
        if (buf.length - offset < 8) {
            console.warn('fileSize 异常');
            break;
        };
        let chunkID = buf.slice(offset, offset + 4).toString();
        offset += 4;
        let chunkSize = buf.readUInt32LE(offset);
        offset += 4;
        let data = buf.slice(offset, offset + chunkSize);
        offset += chunkSize;
        chunks[chunkID] = data;
        chunks.order.push(chunkID);
    };
    return chunks;
};

const parseWAV = (buf) => {
    let FourCC = buf.slice(0, 4).toString();
    if (FourCC !== 'RIFF') {
        throw '档案非 RIFF';
    };
    let fileSize = buf.readUInt32LE(4, 8);
    let fileType = buf.slice(8, 12).toString();
    if (fileType !== 'WAVE') {
        throw '档案非 WAVE';
    };
    let chunks = parseChunks(buf.slice(12, fileSize + 8));
    return chunks;
};

const parseFmt = (buf) => {
    let fmt = {};
    fmt.wFormatTag = buf.readUInt16LE();
    fmt.nChannels = buf.readUInt16LE(2);
    fmt.nSamplesPerSec = buf.readUInt32LE(4);
    fmt.nAvgBytesPerSec = buf.readUInt32LE(8);
    fmt.nBlockAlign = buf.readUInt16LE(12);
    fmt.wBitsPerSample = buf.readUInt16LE(14);
    if (buf.length >= 18) {
        let cbSize = buf.readUInt16LE(16);
        fmt.cbSize = cbSize;
        fmt.extra = {};
        if (cbSize + 18 !== buf.length) {
            cbSize = buf.length - 18;
            console.warn('发现错误的 cbSize，已重置');
        };
        if (cbSize >= 22) {
            let extra = buf.slice(18, cbSize + 18);
            let samples = extra.slice(0, cbSize - 20);
            let offset = 0;
            let union = ['wValidBitsPerSample', 'wSamplesPerBlock', 'wReserved'];
            while (offset < samples.length) {
                fmt.extra[union[offset / 2]] = samples.readUInt16LE(offset);
                offset += 2;
            };
            fmt.extra.dwChannelMask = extra.readUInt32LE(cbSize - 20);
            fmt.extra.subFormat = extra.slice(cbSize - 16, cbSize).toString('hex');
        };
    };
    return fmt;
};

const writeChunks = (obj) => {
    let chunks = [];
    for (let chunk of obj.order) {
        let chunkID = chunk;
        let chunkSize = obj[chunk].length;
        let data = obj[chunk];
        let buf = Buffer.alloc(8);
        buf.write(chunkID);
        buf.writeUInt32LE(chunkSize, 4);
        chunks.push(buf, data);
    };
    return Buffer.concat(chunks);
};

const writeWAV = (obj) => {
    let chunks = writeChunks(obj);
    let buf = Buffer.alloc(12);
    buf.write('RIFF');
    buf.writeUInt32LE(chunks.length + 4, 4);
    buf.write('WAVE', 8);
    return Buffer.concat([buf, chunks]);
};

const writeFmt = (obj) => {
    let fmt = Buffer.alloc(16);
    fmt.writeUInt16LE(obj.wFormatTag);
    fmt.writeUInt16LE(obj.nChannels, 2);
    fmt.writeUInt32LE(obj.nSamplesPerSec, 4);
    fmt.writeUInt32LE(obj.nAvgBytesPerSec, 8);
    fmt.writeUInt16LE(obj.nBlockAlign, 12);
    fmt.writeUInt16LE(obj.wBitsPerSample, 14);
    let cbSize = obj.cbSize;
    if (cbSize !== undefined) {
        let cbSizeBuf = Buffer.alloc(2);
        cbSizeBuf.writeUInt16LE(cbSize);
        let extra = Buffer.alloc(cbSize);
        if (cbSize >= 22) {
            let offset = 0;
            let union = ['wValidBitsPerSample', 'wSamplesPerBlock', 'wReserved'];
            for (let sample of union) {
                if (obj.extra[sample] !== undefined) {
                    extra.writeUInt16LE(obj.extra[sample], offset);
                    offset += 2;
                };
            };
            extra.writeUInt32LE(obj.extra.dwChannelMask, offset);
            Buffer.from(obj.extra.subFormat, 'hex').copy(extra, offset + 4, 0, 16);
        };
        fmt = Buffer.concat([fmt, cbSizeBuf, extra]);
    };
    return fmt;
};

module.exports = {
    parseChunks,
    parseWAV,
    parseFmt,
    writeChunks,
    writeWAV,
    writeFmt,
};
