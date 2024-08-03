// UfData 转音图之家 JS
// 只读取第一个轨道，不支援变速
'use strict';

const fs = require('fs');

const bases = new Map([['C', 60], ['#C', 61], ['bD', 61], ['D', 62], ['#D', 63], ['bE', 63], ['E', 64], ['F', 65], ['#F', 66], ['bG', 66], ['G', 67], ['#G', 68], ['bA', 68], ['A', 69], ['#A', 70], ['bB', 70], ['B', 71]]);
const pitches = ['1', '1.5', '2', '2.5', '3', '4', '4.5', '5', '5.5', '6', '6.5', '7'];

let files = ['阻碍歌'];

// 调号
let key = 'C';
// 量化
let timeUnit = 8;

/* 音图之家可用调号列表
音调名	MIDI 音符编号	频率	偏差
C2	36	62.000 Hz	-92.596 ¢
#C2 / bD2	37	71.000 Hz	+42.065 ¢
D2	38	75.000 Hz	+36.951 ¢
#D2 / bE2	39	78.000 Hz	+4.851 ¢
E2	40	83.000 Hz	+12.416 ¢
F2	41	89.000 Hz	+33.248 ¢
#F2 / bG2	42	95.000 Hz	+46.195 ¢
G2	43	99.000 Hz	+17.596 ¢
#G2 / bA2	44	105.000 Hz	+19.463 ¢
A2	45	112.000 Hz	+31.194 ¢
#A2 / bB2	46	118.000 Hz	+21.540 ¢
B2	47	124.000 Hz	+7.404 ¢
C3	48	132.000 Hz	+15.641 ¢
#C3 / bD3	49	140.000 Hz	+17.508 ¢
D3	50	147.000 Hz	+1.975 ¢
#D3 / bE3	51	156.000 Hz	+4.851 ¢
E3	52	166.000 Hz	+12.416 ¢
F3	53	176.000 Hz	+13.686 ¢
#F3 / bG3	54	185.000 Hz	+0.026 ¢
G3	55	195.000 Hz	-8.835 ¢
#G3 / bA3	56	208.000 Hz	+2.896 ¢
A3	57	221.000 Hz	+7.851 ¢
#A3 / bB3	58	235.000 Hz	+14.189 ¢
B3	59	247.000 Hz	+0.409 ¢
C / C4	60	264.000 Hz	+15.641 ¢
#C / bD / #C4 / bD4	61	279.000 Hz	+11.314 ¢
D / D4	62	295.000 Hz	+7.854 ¢
#D / bE / #D4 / bE4	63	313.000 Hz	+10.391 ¢
E / E4	64	330.000 Hz	+1.955 ¢
F / F4	65	351.000 Hz	+8.761 ¢
#F / bG / #F4 / bG4	66	372.000 Hz	+9.359 ¢
G / G4	67	392.000 Hz	+0.020 ¢
#G / bA / #G4 / bA4	68	419.000 Hz	+15.336 ¢
A / A4	69	442.000 Hz	+7.851 ¢
#A / bB / #A4 / bB4	70	470.000 Hz	+14.189 ¢
B / B4	71	495.000 Hz	+3.910 ¢
C5	72	526.000 Hz	+9.071 ¢
#C5 / bD5	73	558.000 Hz	+11.314 ¢
D5	74	589.000 Hz	+4.917 ¢
#D5 / bE5	75	626.000 Hz	+10.391 ¢
E5	76	662.000 Hz	+7.193 ¢
F5	77	700.000 Hz	+3.822 ¢
#F5 / bG5	78	742.000 Hz	+4.699 ¢
G5	79	785.000 Hz	+2.227 ¢
#G5 / bA5	80	835.000 Hz	+9.127 ¢
A5	81	884.000 Hz	+7.851 ¢
#A5 / bB5	82	935.000 Hz	+4.955 ¢
B5	83	989.000 Hz	+2.160 ¢
C6	84	1046.000 Hz	-0.831 ¢
#C6 / bD6	85	1109.000 Hz	+0.421 ¢
D6	86	1175.000 Hz	+0.502 ¢
#D6 / bE6	87	1245.000 Hz	+0.684 ¢
E6	88	1318.000 Hz	-0.670 ¢
F6	89	1397.000 Hz	+0.108 ¢
#F6 / bG6	90	1480.000 Hz	+0.026 ¢
G6	91	1568.000 Hz	+0.020 ¢
#G6 / bA6	92	1661.000 Hz	-0.228 ¢
A6	93	1760.000 Hz	0
#A6 / bB6	94	1865.000 Hz	+0.320 ¢
B6	95	1976.000 Hz	+0.409 ¢
*/
/* 音图之家可用时值列表
全音符：note
二分音符：note2
四分音符：note4
八分音符：note8
十六分音符：note16
三十二分音符：note32
六十四分音符：note64
一百二十八分音符：note128
二百五十六分音符：note256
*/

let pitchBase = key.match(/^((?:[#b])?[A-G])(\d+)?$/u);
if (pitchBase) {
    let [name, octave] = [pitchBase[1], pitchBase[2] === undefined ? 4 : parseInt(pitchBase[2])];
    if (!bases.has(name) || octave < 2 || octave > 6) {
        pitchBase = null;
    } else {
        pitchBase = bases.get(name) + (octave - 4) * 12;
    };
};
if (pitchBase === null) {
    throw '调号错误';
};
if (!Number.isInteger(timeUnit) || timeUnit < 1 || timeUnit > 256 || timeUnit & (timeUnit - 1)) {
    throw '量化错误';
};
let unitName = timeUnit === 1 ? 'note' : `note${timeUnit}`;
let timeBase = 1920 / timeUnit;

for (let file of files) {
    let ufdata = JSON.parse(fs.readFileSync(`${file}.ufdata`).toString());

    let notes = [];
    let offset = 0;

    if (ufdata.project.tracks[0].notes[offset].tickOn > 0) {
        notes.push(['@@', pitchBase, ufdata.project.tracks[0].notes[offset].tickOn]);
    };
    notes.push([ufdata.project.tracks[0].notes[offset].lyric, ufdata.project.tracks[0].notes[offset].key, ufdata.project.tracks[0].notes[offset].tickOff - ufdata.project.tracks[0].notes[offset].tickOn]);
    offset += 1;

    while (offset < ufdata.project.tracks[0].notes.length) {
        let last = ufdata.project.tracks[0].notes[offset - 1];
        let curr = ufdata.project.tracks[0].notes[offset];

        if (last.tickOff !== curr.tickOn) {
            notes.push(['@@', pitchBase, curr.tickOn - last.tickOff]);
        };

        notes.push([curr.lyric, curr.key, curr.tickOff - curr.tickOn]);

        offset += 1;
    };

    let js = `// 试用版作者指定主页不能更改删除，否则脚本命令不可用\r\nweibo=https://weibo.com/DreamerChw\r\n\r\n//===================================\r\n//===================================\r\n//== 曲调1=?有如下:\r\n//== C1,#C1,D1,#D1,E1,F1,#F1,G1,#G1,A1,#A1,B1\r\n//== C2,#C2,D2,#D2,E2,F2,#F2,G2,#G2,A2,#A2,B2\r\n//== C3,#C3,D3,#D3,E3,F3,#F3,G3,#G3,A3,#A3,B3\r\n//== C,#C,D,#D,E,F,#F,G,#G,A,#A,B\r\n//== C5,#C5,D5,#D5,E5,F5,#F5,G5,#G5,A5,#A5,B5\r\n//== C6,#C6,D6,#D6,E6,F6,#F6,G6,#G6,A6,#A6,B6\r\n//===================================\r\n//===================================\r\n\r\nspeed=${ufdata.project.tempos[0].bpm},\r\nbeat=2/4,\r\n1=${key},\r\n\r\n\r\nSinger=大市唱,\r\n\r\n// 回响参数\r\nreverb=0,    //开启1,关闭0\r\nroom=0.600,    //房间\r\nmix=0.350,     //干湿\r\ndamp=0.200,    //阻尼\r\nvolume=1.200,  //音量\r\n\r\n// 音轨颜色\r\ncolor=143,47,243, //RGB颜色\r\nalpha=200,    //不透明度\r\n\r\n`;

    for (let [lyric, pitch, length] of notes) {
        pitch -= pitchBase;
        let octave = Math.floor(pitch / 12);
        pitch = pitches[(pitch % 12 + 12) % 12];

        if (octave > 0) {
            pitch += 'h'.repeat(octave);
        } else if (octave < 0) {
            pitch += 'l'.repeat(-octave);
        };

        length /= timeBase;

        js += `lyric=${lyric},pitch=${pitch},${unitName}=${length},main=1,\r\n`;
    };

    fs.writeFileSync(`${file}.js`, Buffer.from(js));
};
