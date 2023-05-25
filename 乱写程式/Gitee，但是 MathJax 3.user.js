// ==UserScript==
// @name         Gitee，但是 MathJax 3
// @namespace    https://github.com/mrhso
// @version      0.114514
// @description  毕竟 MathJax 2 实在太慢了
// @author       Ishisashi
// @match        *://gitee.com/*.md
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gitee.com
// @grant        none
// @run-at       document-start
// ==/UserScript==

// 为确保脚本有效，请在设定中将设定模式改为「进阶」，然后找到实验室，将注入模式改为「即时」

(function() {
    'use strict';

    let observer = new MutationObserver((_, observer) => {
        let scripts = document.querySelectorAll('script');
        for (let script of scripts) {
            if (script.innerHTML.match(/MathJax\.Hub\.Config/u)) {
                script.removeAttribute('type');
                script.innerHTML = 'MathJax = {\n  tex: {\n    inlineMath: [[\'$\',\'$\'], [\'\\\\(\',\'\\\\)\']],\n    displayMath: [["$$","$$"],["\\\\[","\\\\]"]],\n    processEscapes: true\n  },\n  options: {\n    skipHtmlTags: [\'script\', \'noscript\', \'style\', \'textarea\', \'pre\', \'code\'],\n    ignoreHtmlClass: "container|files",\n    processHtmlClass: "markdown-body"\n  }\n};';
            };
            if (script.src.match(/https:\/\/cn-assets\.gitee\.com\/uploads\/resources\/MathJax-2\.7\.2\/MathJax\.js\?config=TeX-AMS-MML_HTMLorMML/u)) {
                script.id = 'MathJax-script';
                script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            };
        };
    });

    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
})();