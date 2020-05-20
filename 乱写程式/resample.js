// 暴力调用 SoXR 重采样
// 使用 SoXR 附带的示例程式 3-options-input-fn 作为中介
// 因为是自用的糟粕所以只支援 32-bit 浮点 PCM
'use strict';

const fs = require('fs');
const child_process = require('child_process');
const { parseWAV, parseFmt, writeWAV, writeFmt } = require('./wavHandler.js');

let soxr = '3-options-input-fn';
let rate = 48000;
let bandwidth = 99.999;

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];

for (let file of files) {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);

    if (!(fmt.wFormatTag === 3 && fmt.wBitsPerSample === 32 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 32 && fmt.extra.subFormat === '0300000000001000800000aa00389b71')) {
        throw '不支援的档案';
    };

    if (fmt.nSamplesPerSec === rate) {
        console.log('采样率不变，已排除');
        continue;
    };

    delete wav.fact;
    let fact = wav.order.indexOf('fact');
    if (fact > -1) {
        wav.order.splice(fact, 1);
    };

    let data = wav.data;
    let dataResampled = child_process.execSync(`${soxr} ${fmt.nSamplesPerSec} ${rate} ${fmt.nChannels} 0 0 7 0 ${bandwidth} 100 50 1`, { input: data, maxBuffer: Infinity });

    fmt.nSamplesPerSec = rate;
    fmt.nAvgBytesPerSec = fmt.nSamplesPerSec * fmt.nBlockAlign;

    wav['fmt '] = writeFmt(fmt);
    wav.data = dataResampled;
    wav = writeWAV(wav);
    fs.writeFileSync(`${file}-resampled.wav`, wav);
};
