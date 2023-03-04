// 某个 .NET 写的客户端倒是写得挺 6 的，我不说是谁
'use strict';

const fs = require('fs');
const crypto = require('crypto');

let urls = [];

let str = '';
for (let url of urls) {
    let arr = url.split('/');
    let name = arr[arr.length - 1].split('.').slice(0, -1).join('.');
    let md5 = crypto.createHash('md5').update(Buffer.from(name).slice(-4)).digest('hex');
    arr[arr.length - 1] = `${name}.zip${md5}`;
    let pwd = crypto.createHash('md5').update(Buffer.from(arr.join('/'))).digest('hex');
    str += `${url}\t${pwd}\r\n`;
};

fs.writeFileSync(`./password.txt`, Buffer.from(str));
