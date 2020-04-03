// PBG3 DAT 解析

const buf2bin = (buf) => {
    let str = '';
    for (let b of buf) {
        str += `0000000${b.toString(2)}`.slice(-8);
    };
    return str;
};

const bin2buf = (str) => {
    let arr = [];
    let offset = 0;
    while (offset < str.length) {
        arr.push(parseInt(str.slice(offset, offset + 8), 2));
        offset += 8;
    };
    return Buffer.from(arr);
};

const readInts = (str, count, offset = 0) => {
    let arr = [];
    let nums = 0;
    while (nums < count) {
        let bits = (parseInt(str.slice(offset, offset + 2), 2) + 1) * 8;
        offset += 2;
        let num = parseInt(str.slice(offset, offset + bits), 2);
        arr.push(num);
        offset += bits;
        nums += 1;
    };
    return [arr, offset];
};

const writeInt = (num) => {
    let str = '';
    let bytes;
    if (0 <= num && num <= 255) {
        str += '00';
        let buf = Buffer.alloc(1);
        buf.writeUInt8(num);
        str += buf2bin(buf);
    } else if (256 <= num && num <= 65535) {
        str += '01';
        let buf = Buffer.alloc(2);
        buf.writeUInt16BE(num);
        str += buf2bin(buf);
    } else if (65536 <= num && num <= 16777215) {
        str += '10';
        let buf = Buffer.alloc(3);
        buf.writeUIntBE(num, 0, 3);
        str += buf2bin(buf);
    } else if (16777216 <= num && num <= 4294967295) {
        str += '11';
        let buf = Buffer.alloc(4);
        buf.writeUInt32BE(num);
        str += buf2bin(buf);
    };
    return str;
};

const getChecksum = (buf) => {
    let checksum = 0;
    for (let b of buf) {
        checksum += b;
    };
    return checksum;
};

const parseDAT = (buf) => {
    let magic = buf.slice(0, 4).toString();
    if (magic !== 'PBG3') {
        throw '档案非 PBG3 DAT';
    };

    // 考虑到档头最多 100 位元，就不读整个档案了
    let [[count, tableOffset]] = readInts(buf2bin(buf.slice(4, 13)), 2);
    let table = buf2bin(buf.slice(tableOffset, buf.length));

    let tmp = [];
    let offset = 0;
    let index = 0;
    while (index < count) {
        let unknown1, unknown2, checksum, start, size;
        [[unknown1, unknown2, checksum, start, size], offset] = readInts(table, 5, offset);
        let name = '';
        while (offset < table.length) {
            let str = table.slice(offset, offset + 8);
            if (str === '00000000') {
                offset += 8;
                break;
            } else {
                name += str;
                offset += 8;
            };
        };
        name = bin2buf(name).toString();
        let chunk = { unknown1, unknown2, checksum, start, size, name };
        tmp.push(chunk);
        index += 1;
    };

    let chunks = [];
    tmp.forEach((value, index) => {
        let { unknown1, unknown2, checksum, start, size, name } = value;
        let end = index + 1 === count ? tableOffset : tmp[index + 1].start;
        let data = buf.slice(start, end);
        if (getChecksum(data) !== checksum) {
            throw '校验未通过';
        };
        let chunk = { unknown1, unknown2, size, name, data };
        chunks.push(chunk);
    });

    return chunks;
};

const writeDAT = (arr) => {
    let magic = Buffer.from('PBG3');

    let fileInfo = '';
    let chunks = [];
    let start = 13;
    let offset = 0;
    for (let chunk of arr) {
        fileInfo += writeInt(chunk.unknown1);
        fileInfo += writeInt(chunk.unknown2);
        let checksum = getChecksum(chunk.data);
        fileInfo += writeInt(checksum);
        fileInfo += writeInt(start);
        chunks.push(chunk.data);
        start += chunk.data.length;
        fileInfo += writeInt(chunk.size);
        fileInfo += buf2bin(Buffer.from(`${chunk.name}\0`));
    };
    let infoLen = Math.ceil(fileInfo.length / 8) * 8;
    fileInfo = bin2buf(`${fileInfo}0000000`.slice(0, infoLen));

    let header = '';
    header += writeInt(arr.length);
    header += writeInt(start);
    let headerLen = Math.ceil(header.length / 8) * 8;
    header = bin2buf(`${header}0000000`.slice(0, headerLen));

    let output = Buffer.concat([magic, header, Buffer.alloc(9 - header.length), ...chunks, fileInfo]);

    return output;
};

module.exports = {
    parseDAT,
    writeDAT,
};
