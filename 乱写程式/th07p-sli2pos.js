'use strict';

const fs = require('fs');

let files = ['th07_01', 'th07_02', 'th07_03', 'th07_04', 'th07_05', 'th07_06', 'th07_07'];

for (let file of files) {
    console.log(`${file}.wav.sli`);

    let sli = fs.readFileSync(`${file}.wav.sli`).toString();

    let loop = parseInt(sli.match(/LoopStart=(\d+)/u)[1]);
    let end = loop + parseInt(sli.match(/LoopLength=(\d+)/u)[1]);

    let pos = Buffer.alloc(8);
    pos.writeUInt32LE(loop);
    pos.writeUInt32LE(end, 4);
    fs.writeFileSync(`${file}.pos`, pos);
};
