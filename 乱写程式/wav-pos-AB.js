'use strict';

const fs = require('fs');

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];
const { parseWAV, parseFmt, writeWAV } = require('./wavHandler.js');

for (let file of files) {
    console.log(`${file}.wav`);
    let pos = fs.readFileSync(`${file}.pos`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);

    if (!(fmt.wFormatTag === 1 || fmt.wFormatTag === 65534 && fmt.extra.subFormat === '0100000000001000800000aa00389b71' || fmt.wFormatTag === 3 || fmt.wFormatTag === 65534 && fmt.extra.subFormat === '0300000000001000800000aa00389b71')) {
        throw '不支援的档案';
    };

    delete wav.fact;
    let fact = wav.order.indexOf('fact');
    if (fact > -1) {
        wav.order.splice(fact, 1);
    };

    let block = fmt.nBlockAlign;
    let loop = pos.readUInt32LE() * block;
    let end = pos.readUInt32LE(4) * block;
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
