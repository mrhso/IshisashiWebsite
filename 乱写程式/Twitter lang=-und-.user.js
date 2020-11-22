// ==UserScript==
// @name         Twitter lang="und"
// @namespace    https://github.com/mrhso
// @version      0.114514
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
            let divs = tweet.querySelectorAll('.css-901oao.r-16dba41.r-ad9z0x.r-bcqeeo.r-bnwqim.r-qvutc0');
            for (let div of divs) {
                if (div.lang !== 'und') {
                    div.lang = 'und';
                };
            };
        };
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
})();
