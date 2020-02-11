'use strict';

const fs = require('fs');

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];

for (let file of files) {
    let pos = fs.readFileSync(`${file}.pos`);
    // *.pos 里记录的是采样数，乘以 4 得到字节数
    let loop = pos.readUInt32LE(0) * 4;
    let end = pos.readUInt32LE(4) * 4;
    let wav = fs.readFileSync(`${file}.wav`);
    let header = wav.slice(0, 44);
    let length = header.readUInt32LE(40);
    let data = wav.slice(44, length + 44);
    let meta = wav.slice(length + 44, wav.length);

    let pcm0 = data.slice(0, loop);
    let header0 = Buffer.from(header);
    header0.writeUInt32LE(loop + meta.length + 36, 4);
    header0.writeUInt32LE(loop, 40);
    let wav0 = Buffer.concat([header0, pcm0, meta]);
    fs.writeFileSync(`${file}-0.wav`, wav0);

    let pcm1 = data.slice(loop, end);
    let header1 = Buffer.from(header);
    header1.writeUInt32LE(end - loop + meta.length + 36, 4);
    header1.writeUInt32LE(end - loop, 40);
    let wav1 = Buffer.concat([header1, pcm1, meta]);
    fs.writeFileSync(`${file}-1.wav`, wav1);
};
