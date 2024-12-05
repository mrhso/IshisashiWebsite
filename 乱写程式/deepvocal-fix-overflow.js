// 修复 DeepVocal 导出音频中可能的溢出采样
// 适用于音量为 100% 且平衡为 0 的数据，浮点 PCM 环境下使用
'use strict';

const fs = require('fs');
const { parseWAV, parseFmt, writeWAV } = require('./wavHandler.js');

let files = ['迷路日々_1_Track 1', '迷路日々_2_Track 2', '迷路日々_3_Track 3'];

for (let file of files) {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);
    let depth;

    if (fmt.wFormatTag === 3 && fmt.wBitsPerSample === 32 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 32 && fmt.extra.subFormat === '0300000000001000800000aa00389b71') {
        depth = 32;
    } else if (fmt.wFormatTag === 3 && fmt.wBitsPerSample === 64 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 64 && fmt.extra.subFormat === '0300000000001000800000aa00389b71') {
        depth = 64;
    } else {
        throw '不支援的档案';
    };

    delete wav.fact;
    let fact = wav.order.indexOf('fact');
    if (fact > -1) {
        wav.order.splice(fact, 1);
    };

    let data = wav.data;
    let channel = fmt.nChannels;
    let block = fmt.nBlockAlign;

    let offset = block;

    if (depth === 32) {
        while (offset < data.length) {
            let count = 0;
            while (count < channel) {
                let last = data.readFloatLE(offset - block);
                let curr = data.readFloatLE(offset);
                let diff = curr - last;
                if (Math.abs(diff) > 1.75) {
                    data.writeFloatLE(curr - Math.sign(diff) * 2, offset);
                };
                offset += 4;
                count += 1;
            };
        };
    } else if (depth === 64) {
        while (offset < data.length) {
            let count = 0;
            while (count < channel) {
                let last = data.readDoubleLE(offset - block);
                let curr = data.readDoubleLE(offset);
                let diff = curr - last;
                if (Math.abs(diff) > 1.75) {
                    data.writeDoubleLE(curr - Math.sign(diff) * 2, offset);
                };
                offset += 8;
                count += 1;
            };
        };
    };

    wav = writeWAV(wav);
    fs.writeFileSync(`${file}-fixed.wav`, wav);
};
