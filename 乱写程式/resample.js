// 暴力调用 SoX 重采样
// 因为是自用的糟粕所以只支援 32-bit 浮点 PCM
'use strict';

const fs = require('fs');
const child_process = require('child_process');
const { parseWAV, parseFmt, writeWAV, writeFmt } = require('./wavHandler.js');

let sox = 'sox';
let rate = 48000;
let bandwidth = 99.98;

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];
let mlts = [];
let del = [];

const roundTiesToEven = (num) => {
    if (num % 0.5 === 0) {
        let sign = Math.sign(num);
        let abs = Math.abs(num);
        let trunc = Math.floor(abs);
        if (trunc % 2 === 0) {
            return -sign * Math.round(-abs);
        } else {
            return sign * Math.round(abs);
        };
    } else {
        return Math.round(num);
    };
};

console.log('扫描电平');
files.forEach((file, index) => {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);

    if (!(fmt.wFormatTag === 3 && fmt.wBitsPerSample === 32 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 32 && fmt.extra.subFormat === '0300000000001000800000aa00389b71')) {
        throw '不支援的档案';
    };

    if (fmt.nSamplesPerSec === rate) {
        del.push(index);
        console.log('采样率不变，已排除');
        return;
    };

    let data = wav.data;
    let max = -Infinity;
    let min = Infinity;
    let offset = 0;

    while (offset < data.length) {
        let get = data.readFloatLE(offset);
        if (get > max) {
            max = get;
        };
        if (get < min) {
            min = get;
        };
        offset += 4;
    };

    let mlt = 1500000000 / Math.max(Math.abs(max), Math.abs(min));
    mlts[index] = mlt;
});

del.reverse();
for (let index of del) {
    files.splice(index, 1);
    mlts.splice(index, 1);
};

console.log('定点化');
files.forEach((file, index) => {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);

    delete fmt.cbSize;
    delete fmt.extra;
    fmt.wFormatTag = 1;
    fmt.wBitsPerSample = 32;
    fmt.nBlockAlign = fmt.nChannels * fmt.wBitsPerSample / 8;
    fmt.nAvgBytesPerSec = fmt.nSamplesPerSec * fmt.nBlockAlign;

    let data = wav.data;
    let dataFixed = Buffer.alloc(data.length);

    let offset = 0;
    let offsetFixed = 0;
    let mlt = mlts[index];

    while (offset < data.length) {
        let num = data.readFloatLE(offset);
        let numFixed = roundTiesToEven(num * mlt);
        dataFixed.writeInt32LE(numFixed, offsetFixed);
        offset += 4;
        offsetFixed += 4;
    };

    wav['fmt '] = writeFmt(fmt);
    wav.data = dataFixed;
    wav = writeWAV(wav);
    fs.writeFileSync(`temp${index}-fixed.wav`, wav);
});

console.log('重采样');
files.forEach((file, index) => {
    console.log(`${file}.wav`);
    child_process.execSync(`${sox} temp${index}-fixed.wav temp${index}-sox.wav --no-dither rate -v -b ${bandwidth} ${rate}`);
    fs.unlinkSync(`temp${index}-fixed.wav`);
});

console.log('浮点化');
files.forEach((file, index) => {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let wavSoX = parseWAV(fs.readFileSync(`temp${index}-sox.wav`));
    let fmt = parseFmt(wav['fmt ']);

    fmt.nSamplesPerSec = rate;
    fmt.nAvgBytesPerSec = fmt.nSamplesPerSec * fmt.nBlockAlign;

    let data = wavSoX.data;
    let dataFloat = Buffer.alloc(data.length);

    let offset = 0;
    let offsetFloat = 0;
    let mlt = mlts[index];

    while (offset < data.length) {
        let num = data.readInt32LE(offset);
        let numFloat = num / mlt;
        dataFloat.writeFloatLE(numFloat, offsetFloat);
        offset += 4;
        offsetFloat += 4;
    };

    wav['fmt '] = writeFmt(fmt);
    wav.data = dataFloat;
    wav = writeWAV(wav);
    fs.writeFileSync(`${file}-resampled.wav`, wav);
    fs.unlinkSync(`temp${index}-sox.wav`);
});
