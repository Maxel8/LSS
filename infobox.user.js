// ==UserScript==
// @name         Infobox
// @namespace    http://tampermonkey.net/
// @version      v1.0
// @description  try to take over the world!
// @author       You
// @match        https://www.leitstellenspiel.de/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setTimeout(() => {
    document.body.prepend(info);
}, 2000);

     const info = document.createElement("div");
    info.innerText = "Mein erstes LSS-Skript läuft!";
    info.style.background = "#222";
    info.style.color = "white";
    info.style.padding = "10px";
    info.style.textAlign = "center";
    info.style.fontWeight = "bold";

    console.log("SKRIPT AKTIV");
})();
