// 这个脚本输入为 32-bit 浮点 PCM，输出为 24-bit 定点 PCM
// 有需要可以自行改动
'use strict';

const fs = require('fs');
const { parseWAV, parseFmt, writeWAV, writeFmt } = require('./wavHandler.js');

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];

// 四舍六入五除双
// 这是 IEEE 754 的默认舍入方式
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

for (let file of files) {
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);
    if (!((fmt.wFormatTag === 3 && fmt.wBitsPerSample === 32) || (fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 32 && fmt.extra.wValidBitsPerSample === 32 && fmt.extra.subFormat === '0300000000001000800000aa00389b71'))) {
        throw `${file}.wav: 档案非 32-bit 浮点 PCM`;
    };

    delete fmt.cbSize;
    delete fmt.extra;
    fmt.wFormatTag = 1;
    fmt.wBitsPerSample = 24;
    fmt.nBlockAlign = fmt.nChannels * fmt.wBitsPerSample / 8;
    fmt.nAvgBytesPerSec = fmt.nSamplesPerSec * fmt.nBlockAlign;

    let data = wav.data;
    let dataFixed = Buffer.alloc(data.length / 4 * 3);
    let offset = 0;
    let warnPos;
    let warnNeg;
    while (offset < data.length) {
        let num = data.readFloatLE(offset);
        let numFixed = roundTiesToEven(num * 8388608);
        // 削波
        if (numFixed > 8388607) {
            numFixed = 8388607;
            warnPos = true;
        } else if (numFixed < -8388608) {
            numFixed = -8388608;
            warnNeg = true;
        };
        dataFixed.writeIntLE(numFixed, offset / 4 * 3, 3);
        offset += 4;
    };
    if (warnPos) {
        console.warn(`${file}.wav: 发生正削波`);
    };
    if (warnNeg) {
        console.warn(`${file}.wav: 发生负削波`);
    };

    wav['fmt '] = writeFmt(fmt);
    wav.data = dataFixed;
    wav = writeWAV(wav);
    fs.writeFileSync(`${file}-fixed.wav`, wav);
};
