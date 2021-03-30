// ==UserScript==
// @name         Twitter lang="und"
// @namespace    https://github.com/mrhso
// @version      0.1919810
// @description  lang 全部置 und
// @author       Ishisashi
// @match        *://*.twitter.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let observer = new MutationObserver(() => {
        let tweets = document.querySelectorAll('article');
        for (let tweet of tweets) {
            let divs = tweet.querySelectorAll('.css-901oao.r-16dba41.r-bcqeeo.r-bnwqim.r-qvutc0');
            for (let div of divs) {
                if (div.classList[2] !== 'r-1qd0xha') {
                    div.classList.replace(div.classList[2], 'r-1qd0xha');
                };
                if (div.lang !== 'und') {
                    div.lang = 'und';
                };
            };
        };
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
})();
