// 根据「校正量作用的对象是原始数据流」这一基本原理，该脚本实际上既适用于抓轨也适用于刻录——抓轨时先取数据再用脚本修正，刻录时先用脚本偏移再刻录
'use strict';

const fs = require('fs');
const { parseWAV, parseFmt, writeWAV } = require('./wavHandler.js');

const main = (files, offset, name) => {
    for (let file of files) {
        console.log(`${file}.wav`);
        let wav = parseWAV(fs.readFileSync(`${file}.wav`));
        let fmt = parseFmt(wav['fmt ']);

        if (!(fmt.wFormatTag === 1 && fmt.wBitsPerSample === 16 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 16 && fmt.extra.subFormat === '0100000000001000800000aa00389b71')) {
            throw '不支援的档案';
        };

        delete wav.fact;
        let fact = wav.order.indexOf('fact');
        if (fact > -1) {
            wav.order.splice(fact, 1);
        };

        let data = wav.data;
        let warn;

        if (offset > 0) {
            let leadIn = data.slice(0, offset * 4);
            let leftover = data.slice(offset * 4, data.length);

            let i = 0;
            while (i < leadIn.length) {
                if (leadIn.readUint8(i) !== 0) {
                    warn = true;
                };
                i += 1;
            };

            data = Buffer.concat([leftover, Buffer.alloc(leadIn.length)]);
        } else if (offset < 0) {
            let leftover = data.slice(0, data.length + offset * 4);
            let leadOut = data.slice(data.length + offset * 4, data.length);

            let i = 0;
            while (i < leadOut.length) {
                if (leadOut.readUint8(i) !== 0) {
                    warn = true;
                };
                i += 1;
            };

            data = Buffer.concat([Buffer.alloc(leadOut.length), leftover]);
        };

        if (warn) {
            console.log('非零数据丢失');
        };

        wav.data = data;
        wav = writeWAV(wav);
        fs.writeFileSync(`${file}-${name}.wav`, wav);
    };
};

let files = ['CDImage'];
let offset = +30;

main(files, offset, 'AccurateRip');
main(files, offset - 30, 'absolute');
