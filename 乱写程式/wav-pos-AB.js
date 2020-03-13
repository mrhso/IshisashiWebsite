'use strict';

const fs = require('fs');

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];
const { parseWAV, parseFmt, writeWAV } = require('./wavHandler.js');

for (let file of files) {
    let pos = fs.readFileSync(`${file}.pos`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);
    let channels = fmt.nChannels;
    // 声道数与单声道单采样所占字节数之积
    let bps = fmt.nChannels * fmt.wBitsPerSample / 8;
    // *.pos 里记录的是时间意义上的采样数，不考虑声道
    let loop = pos.readUInt32LE() * bps;
    let end = pos.readUInt32LE(4) * bps;
    let data = wav.data;

    let pcm0 = data.slice(0, loop);
    let wav0 = { ...wav };
    wav0.data = pcm0;
    wav0 = writeWAV(wav0);
    fs.writeFileSync(`${file}-0.wav`, wav0);

    let pcm1 = data.slice(loop, end);
    let wav1 = { ...wav };
    wav1.data = pcm1;
    wav1 = writeWAV(wav1);
    fs.writeFileSync(`${file}-1.wav`, wav1);
};
