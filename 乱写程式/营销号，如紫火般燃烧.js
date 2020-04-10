// 名称 neta 自封魔录四面道中曲「ひもろぎ、むらさきにもえ」
'use strict';

const https = require('https');

let args = process.argv.slice(2);
let event0 = args[0] || '';
let event1 = args[1] || '';
let event = `${event0}${event1}`;

https.get(new URL(`https://image.so.com/i?q=${event}&src=srp`), (res) => {
    let chunks = [];
    res.on('data', (chunk) => {
        chunks.push(chunk);
    });
    res.on('end', () => {
        let chunk = JSON.parse(Buffer.concat(chunks).toString().match(/<script type="text\/data" id="initData">(.*?)<\/script>/u)[1]);
        let imgs = chunk.list;
        // 随机抽取一张图片
        let img = imgs[Math.floor(Math.random() * imgs.length)].img;
        let template = `${event}是怎么回事呢？${event}相信大家都很熟悉，但是${event}是怎么回事呢？下面就让小编带大家一起了解吧。\n${event}，其实就是${event}，大家可能会感到很惊讶，${event0}怎么会${event1}？但事实就是这样，小编也感到非常惊讶。\n${img}\n那么这就是关于${event}的事情了，大家有甚么想法呢？欢迎在评论区告诉小编一起讨论哦。`;
        console.log(template);
    });
});
