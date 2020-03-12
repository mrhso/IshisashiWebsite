// 那么这就是分为两组档案的版本了
'use strict';

const fs = require('fs');
const path = require('path');
const { writeWAV } = require('./wavHandler.js');

let dat = fs.readFileSync('thbgm.dat');
let fmt = fs.readFileSync('thbgm.fmt');

let offset = 0;
while (offset < fmt.length) {
    let pcmFmt = fmt.slice(offset, offset + 52);
    let file = pcmFmt.slice(0, 16).toString().split('\0')[0];
    if (file) {
        let start = pcmFmt.readUInt32LE(16);
        let preload = pcmFmt.readUInt32LE(20);
        // 这里就要用到了
        let loop = pcmFmt.readUInt32LE(24);
        let length = pcmFmt.readUInt32LE(28);

        let pcm0 = dat.slice(start, start + loop);
        let wav0 = { order: ['fmt ', 'data'] };
        wav0['fmt '] = pcmFmt.slice(32, 48);
        wav0.data = pcm0;
        wav0 = writeWAV(wav0);
        fs.writeFileSync(`${file.substring(0, file.length - path.extname(file).length)}-0${path.extname(file)}`, wav0);

        let pcm1 = dat.slice(start + loop, start + length);
        let wav1 = { order: ['fmt ', 'data'] };
        wav1['fmt '] = pcmFmt.slice(32, 48);
        wav1.data = pcm1;
        wav1 = writeWAV(wav1);
        fs.writeFileSync(`${file.substring(0, file.length - path.extname(file).length)}-1${path.extname(file)}`, wav1);
    };
    offset += 52;
};
