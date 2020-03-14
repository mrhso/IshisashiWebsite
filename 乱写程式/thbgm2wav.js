'use strict';

const fs = require('fs');
const path = require('path');
const { writeWAV, parseFmt } = require('./wavHandler.js');

let dat = fs.readFileSync('thbgm.dat');
let fmt = fs.readFileSync('thbgm.fmt');

let offset = 0;
while (offset < fmt.length) {
    let pcmFmt = fmt.slice(offset, offset + 52);
    // 档案名
    let file = pcmFmt.slice(0, 16).toString().split('\0')[0];
    if (file) {
        console.log(file);
        // 起始偏移
        let start = pcmFmt.readUInt32LE(16);
        // 预加载所分配 RAM 区域之大小
        // 原则上不少于整首曲的大小
        let preload = pcmFmt.readUInt32LE(20);
        // 循环点
        let loop = pcmFmt.readUInt32LE(24);
        // 长度
        let length = pcmFmt.readUInt32LE(28);

        let pcm = dat.slice(start, start + length);
        // 注意「fmt」后有空格
        let wav = { order: ['fmt ', 'data'] };
        wav['fmt '] = pcmFmt.slice(32, 48);
        // 后面会用到
        let wavFmt = parseFmt(wav['fmt ']);
        wav.data = pcm;
        wav = writeWAV(wav);
        fs.writeFileSync(file, wav);

        let block = wavFmt.nBlockAlign;
        let pos = Buffer.alloc(8);
        pos.writeUInt32LE(loop / block);
        pos.writeUInt32LE(length / block, 4);
        fs.writeFileSync(`${file.substring(0, file.length - path.extname(file).length)}.pos`, pos);
    };
    offset += 52;
};
