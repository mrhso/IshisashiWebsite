'use strict';

const fs = require('fs');

let files = ['th07_01', 'th07_02', 'th07_03', 'th07_04', 'th07_05', 'th07_06', 'th07_07'];

for (let file of files) {
    console.log(`${file}.pos`);

    let pos = fs.readFileSync(`${file}.pos`);

    let loop = pos.readUInt32LE();
    let length = pos.readUInt32LE(4) - loop;

    let sli = `LoopStart=${loop}\r\nLoopLength=${length}\r\n`;
    fs.writeFileSync(`${file}.wav.sli`, sli);
};
