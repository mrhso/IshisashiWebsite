// 那么这就是分为两组档案的版本了
const fs = require('fs');
const path = require('path');

let dat = fs.readFileSync('thbgm.dat');
let fmt = fs.readFileSync('thbgm.fmt');

let offset = 0;
while (offset < fmt.length) {
    let pcmFmt = fmt.slice(offset, offset + 52);
    let file = pcmFmt.slice(0, 16).toString().split('\0')[0];
    if (file) {
        let start = pcmFmt.readUInt32LE(16);
        // 这里就要用到了
        let loop = pcmFmt.readUInt32LE(24);
        let length = pcmFmt.readUInt32LE(28);

        let pcm0 = dat.slice(start, start + loop);
        let header0 = Buffer.alloc(44);
        header0.write('RIFF', 0);
        header0.writeUInt32LE(loop + 36, 4);
        header0.write('WAVEfmt ', 8);
        header0.writeUInt32LE(16, 16);
        pcmFmt.copy(header0, 20, 32, 48);
        header0.write('data', 36);
        header0.writeUInt32LE(loop, 40);
        let wav0 = Buffer.concat([header0, pcm0]);
        fs.writeFileSync(`${file.substring(0, file.length - path.extname(file).length)}-0${path.extname(file)}`, wav0);

        let pcm1 = dat.slice(start + loop, start + length);
        let header1 = Buffer.alloc(44);
        header1.write('RIFF', 0);
        header1.writeUInt32LE(length - loop + 36, 4);
        header1.write('WAVEfmt ', 8);
        header1.writeUInt32LE(16, 16);
        pcmFmt.copy(header1, 20, 32, 48);
        header1.write('data', 36);
        header1.writeUInt32LE(length - loop, 40);
        let wav1 = Buffer.concat([header1, pcm1]);
        fs.writeFileSync(`${file.substring(0, file.length - path.extname(file).length)}-1${path.extname(file)}`, wav1);
    };
    offset += 52;
};
