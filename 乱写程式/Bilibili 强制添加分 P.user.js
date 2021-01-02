// ==UserScript==
// @name         Bilibili 强制添加分 P
// @namespace    https://github.com/mrhso
// @version      0.114514
// @description  强推投稿工具野蛮
// @author       Ishisashi
// @match        *://member.bilibili.com/video/upload.html*
// @grant        GM.xmlHttpRequest
// @run-at       document-start
// ==/UserScript==

// 为确保脚本有效，请在设定中将设定模式改为「进阶」，然后找到实验室，将注入模式改为「即时」

(function() {
    'use strict';

    let observer = new MutationObserver((_, observer) => {
        let script = document.querySelector('script[src*="app"]');
        if (script) {
            let src = script.src;
            script.remove();
            GM.xmlHttpRequest({
                method: 'GET',
                url: src,
                onload: (response) => {
                    let script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.textContent = response.responseText.replace(/(useMaxVideoCountLimit:function\(.*?\)\{return).*?(\})/gu, '$1!1$2');
                    document.getElementsByTagName('head')[0].appendChild(script);
                }
            });
            observer.disconnect();
        };
    });

    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
})();
