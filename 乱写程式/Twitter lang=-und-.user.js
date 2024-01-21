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

        const processDivs = (divs) => {
            for (let div of divs) {
                let index = [...div.classList].findIndex((value) => value.match(/^r-/u)) + 1;
                if (div.classList[index] !== 'r-1qd0xha') {
                    div.classList.replace(div.classList[index], 'r-1qd0xha');
                };
                if (div.lang !== 'und') {
                    div.lang = 'und';
                };
            };
        };

        for (let tweet of tweets) {
            let tlDivs = tweet.querySelectorAll('.css-901oao.r-16dba41.r-bcqeeo.r-bnwqim.r-qvutc0.css-1rynq56.r-bcqeeo.r-qvutc0.r-37j5jr.r-a023e6.r-rjixqe.r-16dba41.r-bnwqim');
            let replyDivs = tweet.querySelectorAll('.css-1rynq56.r-bcqeeo.r-qvutc0.r-37j5jr.r-1inkyih.r-16dba41.r-bnwqim.r-135wba7');
            let notificationDivs = document.querySelectorAll('.css-1rynq56.r-bcqeeo.r-qvutc0.r-37j5jr.r-a023e6.r-rjixqe.r-16dba41.r-bnwqim');

            processDivs(tlDivs);
            processDivs(replyDivs);
            processDivs(notificationDivs);
        };
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
})();
