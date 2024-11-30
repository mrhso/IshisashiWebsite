// 不知道有甚么用，而且写得很乱，总之先放这再说
'use strict';

const names = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const nums = ['4', '1', '5', '2', '6', '3', '7'];
const tpcs = new Map();
names.forEach((value, index) => tpcs.set(value, index));
const baseOct = [2, 4, 5, 7, 8, 10, 11];

const baseAcc2tpc = (base, acc) =>{
    let tpc = base + 13;
    tpc += 7 * acc;

    return tpc;
};

const tpc2baseAcc = (tpc) =>{
    let base = (tpc % 7 + 8) % 7;
    let acc = (tpc - 13 - base) / 7;

    return [base, acc];
};

const name2baseAcc = (name) => {
    let arr = [...name];
    let offset = 0;

    let base = tpcs.get(arr[offset].toUpperCase());
    offset += 1;

    let acc = 0;
    while (offset < arr.length) {
        if (arr[offset] === '𝄪' || arr[offset] === 'x') {
            acc += 2;
        } else if (arr[offset] === '♯' || arr[offset] === '#') {
            acc += 1;
        } else if (arr[offset] === '♭' || arr[offset] === 'b') {
            acc -= 1;
        } else if (arr[offset] === '𝄫') {
            acc -= 2;
        };

        offset += 1;
    };

    return [base, acc];
};

const baseAcc2name = (base, acc) => {
    let name = '';

    name += names[base];

    if (acc % 2 === 1) {
        name += '♯';
        acc -= 1;
    } else if (acc % 2 === -1) {
        name += '♭';
        acc += 1;
    };

    let chr = '𝄪';
    if (acc < 0) {
        acc = -acc;
        chr = '𝄫';
    };

    name += chr.repeat(acc / 2);

    return name;
};

const tpcOct2monzo = (tpc, oct) => {
    let exp3 = tpc - 14;

    let [base, acc] = tpc2baseAcc(tpc);

    let exp2 = oct - baseOct[base];
    exp2 += -11 * acc;

    return [exp2, exp3];
};

const monzo2tpcOct = (monzo) => {
    let [exp2, exp3] = monzo;

    let tpc = exp3 + 14;

    let [base, acc] = tpc2baseAcc(tpc);

    let oct = exp2 + baseOct[base];
    oct -= -11 * acc;

    return [tpc, oct];
};

const monzo2midi = (monzo) => {
    let [exp2, exp3] = monzo;

    let midi = 12 * exp2 + 19 * exp3 + 60;

    return midi;
};

const midiTpc2monzo = (midi, tpc) => {
    let exp3 = tpc - 14;

    let exp2 = (midi - 60 - 19 * exp3) / 12;

    return [exp2, exp3];
};

const midiAcc2base = (midi, acc) => (7 * (midi - acc) % 12 + 13) % 12;

const qualityNumber2monzo = (quality, number) => {
    let exp3 = 0;
    if (quality === 0) {
        exp3 = (2 * number % 7 + 7) % 7 - 2;
    } else {
        exp3 = 7 * quality - 5 * Math.sign(quality) + ((5 * Math.sign(quality) + 2 * number) % 7 + 8) % 7 - 3;
    };

    let exp2 = (number - 11 * exp3 - 1) / 7;

    return [exp2, exp3];
};

const monzo2qualityNumber = (monzo) => {
    let [exp2, exp3] = monzo;

    let quality = 0;
    if (Math.abs(exp3) > 1) {
        quality = Math.floor((Math.abs(exp3) + 8) / 7) * Math.sign(exp3);
    };

    let number = 7 * exp2 + 11 * exp3 + 1;

    return [quality, number];
};

const name2quality = (name) => {
    if (name[0] === 'd') {
        return -name.length - 1;
    } else if (name === 'm') {
        return -1;
    } else if (name === 'P') {
        return 0;
    } else if (name === 'M') {
        return 1;
    } else if (name[0] === 'A') {
        return name.length + 1;
    };
};

const quality2name = (quality) => {
    if (quality < -1) {
        return 'd'.repeat(-quality - 1);
    } else if (quality === -1) {
        return 'm';
    } else if (quality === 0) {
        return 'P';
    } else if (quality === 1) {
        return 'M';
    } else if (quality > 1) {
        return 'A'.repeat(quality - 1);
    };
};

const monzo2jianpu = (monzo, key) => {
    let jianpu = '';

    let octKey = tpc2baseAcc(key)[0] === 6 ? 3 : 4;
    let monzoKey = tpcOct2monzo(key, octKey);

    let [tpcInterval, octInterval] = monzo2tpcOct([monzo[0] - monzoKey[0], monzo[1] - monzoKey[1]]);
    let [baseInterval, accInterval] = tpc2baseAcc(tpcInterval);
    octInterval -= 4;

    if (accInterval % 2 === 1) {
        jianpu += '♯';
        accInterval -= 1;
    } else if (accInterval % 2 === -1) {
        jianpu += '♭';
        accInterval += 1;
    };

    let chr = '𝄪';
    if (accInterval < 0) {
        accInterval = -accInterval;
        chr = '𝄫';
    };

    jianpu += chr.repeat(accInterval / 2);

    jianpu += nums[baseInterval];

    chr = '↑';
    if (octInterval < 0) {
        octInterval = -octInterval;
        chr = '↓';
    };

    jianpu += chr.repeat(octInterval);

    return jianpu;
};
