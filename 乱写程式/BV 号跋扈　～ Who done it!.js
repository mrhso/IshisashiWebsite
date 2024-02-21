// 最早改写自 https://www.zhihu.com/question/381784377/answer/1099438784，并加上一些适当的处理
// 我这人虽然是写 JS 的，但是看 Python 不是问题
// 后根据某 Bilibili 员工不慎释出的 Golang 代码修正
'use strict';

const err = '¿你在想桃子？';

const table = [...'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf'];
// JS 中 Number 的位运算只适用于 32 位整数，故用 BigInt
const xor = 23442827791579n;
const rangeLeft = 1n;
const rangeRight = 2n ** 51n;
const base = 58n;

const av2bv = (av) => {
    let num = av;
    if (Object.prototype.toString.call(num) === '[object String]') {
        num = parseInt(num.replace(/^[Aa][Vv]/u, ''));
    };
    if (Object.prototype.toString.call(num) !== '[object BigInt]' && !Number.isInteger(num)) {
        throw err;
    };
    num = BigInt(num);
    if (num < rangeLeft || num >= rangeRight) {
        throw err;
    };

    num = num + rangeRight ^ xor;
    let result = [...'BV1000000000'];
    let i = 11;
    while (num !== 0n) {
        result[i] = table[Number(num % base)];
        num /= base;
        i -= 1;
    };

    [result[3], result[9]] = [result[9], result[3]];
    [result[4], result[7]] = [result[7], result[4]];

    return result.join('');
};

const bv2av = (bv) => {
    let str = '';
    if (bv.length === 12) {
        str = bv;
    } else if (bv.length === 10) {
        str = `BV${bv}`;
    // 根据官方 API，BV 号开头的 BV1 其实可以省略
    // 不过单独省略个 B 又不行（
    } else if (bv.length === 9) {
        str = `BV1${bv}`;
    } else {
        throw err;
    };
    if (!str.match(/^[Bb][Vv]1[FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf]{9}$/u)) {
        throw err;
    };
    str = [...str];

    [str[3], str[9]] = [str[9], str[3]];
    [str[4], str[7]] = [str[7], str[4]];
    str.splice(0, 3);

    let result = 0n;
    let i = 0;
    while (i < 9) {
        result = result * base + BigInt(table.indexOf(str[i]));
        i += 1;
    };

    if (result < rangeRight || result >= rangeRight * 2n) {
        throw err;
    };

    result = result % rangeRight ^ xor;

    if (result < rangeLeft) {
        throw err;
    };

    return `av${result}`;
};

module.exports = {
    av2bv,
    bv2av,
};
