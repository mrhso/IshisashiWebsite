// 这个脚本输入为 24-bit 定点 PCM，输出为 32-bit 浮点 PCM
// 有需要可以自行改动
'use strict';

const fs = require('fs');
const { parseWAV, parseFmt, writeWAV, writeFmt } = require('./wavHandler.js');

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];

for (let file of files) {
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);
    if (!((fmt.wFormatTag === 1 && fmt.wBitsPerSample === 24) || (fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 24 && fmt.extra.wValidBitsPerSample === 24 && fmt.extra.subFormat === '0100000000001000800000aa00389b71'))) {
        throw `${file}.wav: 档案非 24-bit 定点 PCM`;
    };

    delete fmt.cbSize;
    delete fmt.extra;
    fmt.wFormatTag = 3;
    fmt.wBitsPerSample = 32;
    fmt.nBlockAlign = fmt.nChannels * fmt.wBitsPerSample / 8;
    fmt.nAvgBytesPerSec = fmt.nSamplesPerSec * fmt.nBlockAlign;

    let data = wav.data;
    let dataFloat = Buffer.alloc(data.length / 3 * 4);
    let offset = 0;
    while (offset < data.length) {
        let num = data.readIntLE(offset, 3);
        let numFloat = num / 8388608;
        dataFloat.writeFloatLE(numFloat, offset / 3 * 4);
        offset += 3;
    };

    wav['fmt '] = writeFmt(fmt);
    wav.data = dataFloat;
    wav = writeWAV(wav);
    fs.writeFileSync(`${file}-float.wav`, wav);
};
