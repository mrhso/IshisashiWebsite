// 用脚写出来的东西
// MP3 和 PDF 提取起来很简单，所以就不放了
'use strict';

const sqlite3 = require('sqlite3');
const fs = require('fs');
const pify = (...args) => import('pify').then(({ default: pify }) => pify(...args));

let img2chr = new Map([['100.gif', 'd'], ['101.gif', 'e'], ['102.gif', 'f'], ['103.gif', 'ɡ'], ['104.gif', 'h'], ['105.gif', 'i'], ['106.gif', 'j'], ['107.gif', 'k'], ['108.gif', 'l'], ['109.gif', 'm'], ['110.gif', 'n'], ['111.gif', 'o'], ['112.gif', 'p'], ['114.gif', 'r'], ['115.gif', 's'], ['116.gif', 't'], ['117.gif', 'u'], ['118.gif', 'v'], ['119.gif', 'w'], ['120.gif', 'x'], ['121.gif', 'y'], ['122.gif', 'z'], ['34.gif', 'ˈ'], ['37.gif', 'ˌ'], ['38.gif', 'æ'], ['38126.gif', 'æ̃'], ['40.gif', '('], ['41.gif', ')'], ['44.gif', ','], ['45.gif', '-'], ['51.gif', 'ɜ'], ['58.gif', 'ː'], ['59.gif', 'ː'], ['64.gif', 'ə'], ['65.gif', 'ɑ'], ['65126.gif', 'ɑ̃'], ['6559126.gif', 'ɑ̃ː'], ['68.gif', 'ð'], ['73.gif', 'ɪ'], ['78.gif', 'ŋ'], ['79.gif', 'ɔ'], ['7959126.gif', 'ɔ̃ː'], ['81.gif', 'ɒ'], ['81126.gif', 'ɒ̃'], ['83.gif', 'ʃ'], ['84.gif', 'θ'], ['85.gif', 'ʊ'], ['86.gif', 'ʌ'], ['90.gif', 'ʒ'], ['97.gif', 'a'], ['98.gif', 'b'], ['amacr.gif', 'ā'], ['blarrow.gif', '→'], ['check.gif', '✓'], ['cuberoot.gif', '∛'], ['cw.gif', '·'], ['epsi.gif', 'ε'], ['flat.gif', '♭'], ['frac14.gif', '¼'], ['frac34.gif', '¾'], ['half.gif', '½'], ['lowerquote.gif', 'ˌ'], ['natur.gif', '♮'], ['partial.gif', 'ə'], ['pause.gif', '𝄐'], ['phis.gif', 'φ'], ['sharp.gif', '♯'], ['spchar1.gif', '咎'], ['spchar10.gif', '䶄'], ['spchar11.gif', '綹'], ['spchar12.gif', '晷'], ['spchar14.gif', '鱂'], ['spchar15.gif', '䴈'], ['spchar16.gif', '𧴌'], ['spchar17.gif', '㺢'], ['spchar18.gif', '㹢'], ['spchar19.gif', '狓'], ['spchar2.gif', '魣'], ['spchar20.gif', '𨧀'], ['spchar21.gif', '𨨏'], ['spchar22.gif', '䓬'], ['spchar23.gif', '𥻗'], ['spchar24.gif', '䥑'], ['spchar25.gif', '𨭆'], ['spchar26.gif', '𨭎'], ['spchar27.gif', '𪄳'], ['spchar28.gif', '䴉'], ['spchar29.gif', '䗩'], ['spchar3.gif', '𤟥'], ['spchar30.gif', '䮎'], ['spchar4.gif', '𠳐'], ['spchar5.gif', '㹴'], ['spchar6.gif', '皙'], ['spchar7.gif', '㞎'], ['spchar8.gif', '𤧛'], ['spchar9.gif', '鱥'], ['swastika.gif', '卍'], ['thetas.gif', 'θ'], ['upsi_lower.gif', 'υ'], ['upsi_upper.gif', 'Υ']]);
let drm = [[' one ', ' #6# '], [' two ', ' #0# '], [' six ', ' #1# '], [' ten ', ' #2# '], [' four ', ' #99# '], [' five ', ' #44# '], [' nine ', ' #55# '], [' three ', ' #888# '], [' seven ', ' #333# '], [' eight ', ' #777# '], [' #1# ', ' one '], [' #2# ', ' two '], [' #6# ', ' six '], [' #0# ', ' ten '], [' #44# ', ' four '], [' #55# ', ' five '], [' #99# ', ' nine '], [' #333# ', ' three '], [' #777# ', ' seven '], [' #888# ', ' eight ']];

let files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const main = async () => {
    let str = '';

    for (let file of files) {
        let db = await pify(new sqlite3.Database(`./mp3/${file}US.db`, sqlite3.OPEN_READONLY));
        let rows = await db.all('SELECT * FROM HeadWord;');
        for (let { ID, RootUID, FN, HW, POS, Data, DataShort } of rows) {
            let data = Data.toString();
            if (parseInt(RootUID) % 2 === 0) {
                for (let [from, to] of drm) {
                    data = data.replace(new RegExp(from, 'gu'), to);
                    offset += 1;
                };
            };
            // 龟头球：犬科动物的一种构造
            // 不知怎么想到了这词
            // 因为有些词的 HW 是空的，就用这个标记以便后续填充
            let text = `${HW || '狼龟头球'}${POS ? ' [' + POS + ']' : ''}`.replace(/&amp;/gu, '&');
            let html = '<link rel="stylesheet" type="text/css" href="css/oa_genie_style.css" />\r\n' + data
            .replace(/\r\n/gu, '\n').replace(/\r/gu, '\n').replace(/\n/gu, '\r\n')
            .match(/<body.*?>\r\n(.*)\r\n<\/body>/su)[1]
            .replace(/<a href="#" on[Cc]lick="window\.external\.viewmode\('[Ss]hort'\)"><img src="viewshort\.gif" border="0">/gu, '')
            .replace(/<a href="#" on[Cc]lick="window\.external\.playaudio\('(.*?)'\)">/gu, (_, name) => {
                name = name.replace(/.*\//gu, '');
                return `<a href="sound://audio/${name}">`;
            })
            .replace(/<img src="(.*?)".*?>/gu, (_, name) => {
                if (img2chr.has(name.toLowerCase())) {
                    return img2chr.get(name.toLowerCase());
                };
                return _;
            })
            .replace(/<img src="(.*?)"/gu, '<img src="images/$1"');
            str += `${text}\r\n${html}\r\n</>\r\n`;
        };
        db.close();
    };

    fs.writeFileSync(`./dict.txt`, Buffer.from(str));
};

main();
