'use strict';

const fs = require('fs');

let dat = fs.readFileSync('thbgm.dat');
let fmt = fs.readFileSync('thbgm.fmt');

let offset = 0;
while (offset < fmt.length) {
    let pcmFmt = fmt.slice(offset, offset + 52);
    // 档案名
    let file = pcmFmt.slice(0, 16).toString().split('\0')[0];
    if (file) {
        // 起始偏移
        let start = pcmFmt.readUInt32LE(16);
        // 后面 4 位元组希腊奶
        // 循环点，但是这个版本并不会用到
        let loop = pcmFmt.readUInt32LE(24);
        // 长度
        let length = pcmFmt.readUInt32LE(28);

        let pcm = dat.slice(start, start + length);
        let header = Buffer.alloc(44);
        header.write('RIFF', 0);
        // 44 - 8 = 36
        header.writeUInt32LE(length + 36, 4);
        // 注意「fmt」后有空格
        header.write('WAVEfmt ', 8);
        // PCM 信息占 16 位元组
        header.writeUInt32LE(16, 16);
        pcmFmt.copy(header, 20, 32, 48);
        header.write('data', 36);
        header.writeUInt32LE(length, 40);
        let wav = Buffer.concat([header, pcm]);
        fs.writeFileSync(file, wav);
    };
    offset += 52;
};
