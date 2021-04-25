'use strict';

const fs = require('fs');
const path = require('path');
const { parseWAV } = require('./wavHandler.js');

let files = ['00a', '00b', '00c', '01a', '01b', '02a', '02b', '03a', '03b', '04a', '04b', '05a', '05b', '06a', '07a', '08a', '09a', 'sys00_op', 'sys99_ed', '51', '52', '53', '54', '56', '57', '58', '59', '60', '61', '62', '63', '65', '67', '68'];

for (let file of files) {
    console.log(`${file}.pos`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));

    let loop = wav['cue '].readUInt32LE(8);
    let end = loop + wav.LISTadtl.readUInt32LE(16);

    let pos = Buffer.alloc(8);
    pos.writeUInt32LE(loop);
    pos.writeUInt32LE(end, 4);
    fs.writeFileSync(`${file}.pos`, pos);
};
