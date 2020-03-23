// 这个脚本输入为定点 PCM，输出为 32-bit 浮点 PCM
// 有需要可以自行改动
'use strict';

const fs = require('fs');
const { parseWAV, parseFmt, writeWAV, writeFmt } = require('./wavHandler.js');

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];

for (let file of files) {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);
    let depth;

    if (fmt.wFormatTag === 1 && fmt.wBitsPerSample === 8 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 8 && fmt.extra.subFormat === '0100000000001000800000aa00389b71') {
        depth = 8;
    } else if (fmt.wFormatTag === 1 && fmt.wBitsPerSample === 16 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 16 && fmt.extra.subFormat === '0100000000001000800000aa00389b71') {
        depth = 16;
    } else if (fmt.wFormatTag === 1 && fmt.wBitsPerSample === 24 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 24 && fmt.extra.subFormat === '0100000000001000800000aa00389b71') {
        depth = 24;
    } else if (fmt.wFormatTag === 1 && fmt.wBitsPerSample === 32 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 32 && fmt.extra.subFormat === '0100000000001000800000aa00389b71') {
        depth = 32;
    } else {
        throw '不支援的档案';
    };

    delete fmt.cbSize;
    delete fmt.extra;
    fmt.wFormatTag = 3;
    fmt.wBitsPerSample = 32;
    fmt.nBlockAlign = fmt.nChannels * fmt.wBitsPerSample / 8;
    fmt.nAvgBytesPerSec = fmt.nSamplesPerSec * fmt.nBlockAlign;

    let data = wav.data;
    let dataFloat;

    if (depth === 8) {
        dataFloat = Buffer.alloc(data.length * 4);
    } else if (depth === 16) {
        dataFloat = Buffer.alloc(data.length * 2);
    } else if (depth === 24) {
        dataFloat = Buffer.alloc(data.length / 3 * 4);
    } else if (depth === 32) {
        dataFloat = Buffer.alloc(data.length);
    };

    let offset = 0;
    let offsetFloat = 0;

    if (depth === 8) {
        while (offset < data.length) {
            // WAV 中 8-bit PCM 是无符号整数，以 128 为中心
            let num = data.readUInt8(offset) - 128;
            let numFloat = num / 128;
            dataFloat.writeFloatLE(numFloat, offsetFloat);
            offset += 1;
            offsetFloat += 4;
        };
    } else if (depth === 16) {
        while (offset < data.length) {
            let num = data.readInt16LE(offset);
            let numFloat = num / 32768;
            dataFloat.writeFloatLE(numFloat, offsetFloat);
            offset += 2;
            offsetFloat += 4;
        };
    } else if (depth === 24) {
        while (offset < data.length) {
            let num = data.readIntLE(offset, 3);
            let numFloat = num / 8388608;
            dataFloat.writeFloatLE(numFloat, offsetFloat);
            offset += 3;
            offsetFloat += 4;
        };
    } else if (depth === 32) {
        while (offset < data.length) {
            let num = data.readInt32LE(offset);
            let numFloat = num / 2147483648;
            dataFloat.writeFloatLE(numFloat, offsetFloat);
            offset += 4;
            offsetFloat += 4;
        };
    };

    wav['fmt '] = writeFmt(fmt);
    wav.data = dataFloat;
    wav = writeWAV(wav);
    fs.writeFileSync(`${file}-float.wav`, wav);
};
