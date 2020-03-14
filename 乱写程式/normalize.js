// 将所有档案作为一个整体标准化
// 这个脚本仅能处理浮点 PCM
// 也不会考虑 max 或 min 为 0 的情况
'use strict';

const fs = require('fs');
const { parseWAV, parseFmt, writeWAV } = require('./wavHandler.js');

let files = ['th06_01', 'th06_02', 'th06_03', 'th06_04', 'th06_05', 'th06_06', 'th06_07', 'th06_08', 'th06_09', 'th06_10', 'th06_11', 'th06_12', 'th06_13', 'th06_14', 'th06_15', 'th06_16', 'th06_17'];

console.log('扫描电平');
// 扫描电平
let max = -Infinity;
let min = Infinity;
for (let file of files) {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);
    let depth;

    if (fmt.wFormatTag === 3 && fmt.wBitsPerSample === 32 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 32 && fmt.extra.wValidBitsPerSample === 32 && fmt.extra.subFormat === '0300000000001000800000aa00389b71') {
        depth = 32;
    } else if (fmt.wFormatTag === 3 && fmt.wBitsPerSample === 64 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 64 && fmt.extra.wValidBitsPerSample === 64 && fmt.extra.subFormat === '0300000000001000800000aa00389b71') {
        depth = 64;
    } else {
        throw '不支援的档案';
    };

    let data = wav.data;
    let offset = 0;

    if (depth === 32) {
        while (offset < data.length) {
            let get = data.readFloatLE(offset);
            if (get > max) {
                max = get;
            };
            if (get < min) {
                min = get;
            };
            offset += 4;
        };
    } else if (depth === 64) {
        while (offset < data.length) {
            let get = data.readDoubleLE(offset);
            if (get > max) {
                max = get;
            };
            if (get < min) {
                min = get;
            };
            offset += 8;
        };
    };
};

const getMlt = (num) => {
    // 16-bit integer 的范围是 [-32768, 32767]，对应 [-1, 32767 / 32768]，可见正负不对称
    // 为了避免正数削波，只能到 32767 / 32768
    // 负数则可以到 -1
    // 因此需要考虑符号
    let sign = Math.sign(num);
    // 为了防止正负倒错，比率只能是正数
    let abs = Math.abs(num);
    // 实际上这样的操作精度对 32-bit 浮点是没问题的，因为 JS 内部精度是 64-bit 浮点
    // 虽然说 x / y 和 x * (1 / y) 因为精度问题不会相等，但因为计算全程使用 64-bit 浮点，降到 32-bit 浮点就是相等的了
    // 64-bit 浮点倒是有问题，不过这么高的位数一般也只用于内部处理，甚至只是从 32-bit 浮点转换而来的中间档案
    if (sign === 1) {
        return 32767 / 32768 / abs;
    } else if (sign === -1) {
        return 1 / abs;
    } else {
        throw 'max 或 min 为 0';
    };
};

// 为了防止削波当然只能取最小值
let mlt = Math.min(getMlt(max), getMlt(min));

console.log('标准化');
// 现在就是暴力计算了
for (let file of files) {
    console.log(`${file}.wav`);
    let wav = parseWAV(fs.readFileSync(`${file}.wav`));
    let fmt = parseFmt(wav['fmt ']);
    let depth;

    if (fmt.wFormatTag === 3 && fmt.wBitsPerSample === 32 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 32 && fmt.extra.wValidBitsPerSample === 32 && fmt.extra.subFormat === '0300000000001000800000aa00389b71') {
        depth = 32;
    } else if (fmt.wFormatTag === 3 && fmt.wBitsPerSample === 64 || fmt.wFormatTag === 65534 && fmt.wBitsPerSample === 64 && fmt.extra.wValidBitsPerSample === 64 && fmt.extra.subFormat === '0300000000001000800000aa00389b71') {
        depth = 64;
    };

    let data = wav.data;
    let offset = 0;

    if (depth === 32) {
        while (offset < data.length) {
            let get = data.readFloatLE(offset);
            data.writeFloatLE(get * mlt, offset);
            offset += 4;
        };
    } else if (depth === 64) {
        while (offset < data.length) {
            let get = data.readDoubleLE(offset);
            data.writeDoubleLE(get * mlt, offset);
            offset += 8;
        };
    };

    wav = writeWAV(wav);
    fs.writeFileSync(`${file}-normalized.wav`, wav);
};
