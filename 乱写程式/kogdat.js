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
        let chunk = {unknown1, unknown2, checksum, start, size};
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
        chunk.name = bin2buf(name).toString();
        tmp.push(chunk);
        index += 1;
    };

    let chunks = [];
    tmp.forEach((value, index) => {
        let { unknown1, unknown2, checksum, start, size, name } = value;
        let chunk = { unknown1, unknown2, size, name };
        let end = index + 1 === count ? tableOffset : tmp[index + 1].start;
        let data = buf.slice(start, end);
        chunk.data = data;
        if (getChecksum(data) !== checksum) {
            throw '校验未通过';
        };
        chunks.push(chunk);
    });

    return chunks;
};

module.exports = {
    parseDAT,
};
