// ==UserScript==
// @name         教育部全国青少年普法网练习自动答题
// @namespace    https://github.com/mrhso
// @version      0.1919810
// @description  非常谔谔，非常野蛮
// @author       Ishisashi
// @match        *://static.qspfw.moe.gov.cn/xf2022/learn-practice.html?*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    let questions = [];
    for (let data of questionBankList_cache) {
        questions.push([data.content, parseInt(data.answer.replace(/A/gu, '1').replace(/B/gu, '2').replace(/C/gu, '4').replace(/D/gu, '8').replace(/E/gu, '16'))]);
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const answer = () => {
        let done = false;
        for (let [question, answer] of questions) {
            let input = document.getElementsByClassName('exam_question')[0].children[0].innerHTML;
            if (input === question) {
                let length = document.getElementsByClassName('item ').length;
                let option = 0;
                while (option < length) {
                    if (document.getElementsByClassName('item ')[option] && answer >> option & 1) {
                        document.getElementsByClassName('item ')[option].click();
                    };
                    option += 1;
                };
                done = true;
                break;
            };
        };
        if (!done) {
            alert('题库无此题。');
        };
    };

    await sleep(10);
    let offset = 0;
    while (offset < 5) {
        answer();
        await sleep(10);
        offset === 4 ? nextExam() : nextQuestion();
        await sleep(10);
        offset += 1;
    };
})();
