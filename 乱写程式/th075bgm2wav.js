'use strict';

const fs = require('fs');
const path = require('path');
const { parseDAT } = require('./th075dat.js');
const { parseWAV } = require('./wavHandler.js');

let dat = parseDAT(fs.readFileSync('th075bgm.dat'));

for (let chunk of dat) {
    let file = path.basename(chunk.name);
    console.log(file);

    fs.writeFileSync(file, chunk.data);

    let wav = parseWAV(chunk.data);

    let loop = wav['cue '].readUInt32LE(8);
    let end = loop + wav.LISTadtl.readUInt32LE(16);

    let pos = Buffer.alloc(8);
    pos.writeUInt32LE(loop);
    pos.writeUInt32LE(end, 4);
    fs.writeFileSync(`${file.substring(0, file.length - path.extname(file).length)}.pos`, pos);
};
