'use strict';

const fs = require('fs');
const { parseWAV, parseFmt } = require('./wavHandler.js');

let files = ['th07_01', 'th07_02', 'th07_03', 'th07_04', 'th07_05', 'th07_06', 'th07_07', 'th07_08', 'th07_09', 'th07_10', 'th07_11', 'th07_12', 'th07_13', 'th07_13b', 'th07_14', 'th07_15', 'th07_16', 'th07_17', 'th07_18', 'th07_19'];
// 档头具体视版本而定，这里以妖妖梦为例
let header = Buffer.from([0x5A, 0x57, 0x41, 0x56, 0x01, 0x00, 0x00, 0x00, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
let fmt = [];
let dat = [header];
let offset = header.length;

for (let file of files) {
    let pcmFmt = Buffer.alloc(52);
    pcmFmt.write(`${file}.wav`);
    pcmFmt.writeUInt32LE(offset, 16);

    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let wavFmt = parseFmt(wav['fmt ']);
    let block = wavFmt.nBlockAlign;

    let pos = fs.readFileSync(`${file}.pos`);
    let loop = pos.readUInt32LE() * block;
    let length = pos.readUInt32LE(4) * block;
    // 不知道要多大，就按曲长判断了
    let preload = length;
    let data = wav.data.slice(0, length);

    pcmFmt.writeUInt32LE(preload, 20);
    pcmFmt.writeUInt32LE(loop, 24);
    pcmFmt.writeUInt32LE(length, 28);
    wav['fmt '].copy(pcmFmt, 32, 0, 16);
    fmt.push(pcmFmt);
    dat.push(data);
    offset += data.length;
};

fs.writeFileSync('thbgm.fmt', Buffer.concat(fmt));
fs.writeFileSync('thbgm.dat', Buffer.concat(dat));
