// ==UserScript==
// @name         XCaptcha
// @namespace    https://github.com/mrhso
// @version      0.114514
// @description  XCaptcha ~ Who done it!
// @author       Ishisashi
// @match        http://202.38.93.111:10047/xcaptcha
// @icon         https://www.google.com/s2/favicons?sz=64&domain=93.111
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    for (let captcha of document.getElementsByClassName('form-group')) {
        let result = eval(captcha.innerText.replace(/\+/gu, 'n+').replace(/ 的结果是？/gu, 'n')).toString();
        captcha.children[1].value = result;
    };

    setTimeout(() => {
        document.getElementById('submit').click();
    }, 200);
})();