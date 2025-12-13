// ==UserScript==
// @name         Infobox
// @namespace    http://tampermonkey.net/
// @version      v1.0.1
// @description  Fügt einen Header ganz oben an.
// @author       Max8
// @match        https://www.leitstellenspiel.de/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setTimeout(() => {
    document.body.prepend(info);
}, 2000);


const apiUrl = "https://www.leitstellenspiel.de/api/userinfo";

fetch(apiUrl, { credentials: "include" })
  .then(response => response.json())
  .then(data => {

    const credits_user_total = data.credits_user_total;
  })
  .catch(error => console.error("Fehler beim Laden der API:", error));


    if (200 < credits_user_total > 0) {
    let ziel = 200 - credits_user_total;
} else if (10000 < credits_user_total > 200) {
    let ziel = 10000 - credits_user_total;
        } else if (100000 < credits_user_total > 10000) {
    let ziel = 100000 - credits_user_total;
        } else if (1000000 < credits_user_total > 100000) {
    let ziel = 1000000 - credits_user_total;
        } else if (5000000 < credits_user_total > 1000000) {
    let ziel = 5000000 - credits_user_total;
        } else if (10000000 < credits_user_total > 5000000) {
    let ziel = 10000000 - credits_user_total;
        } else if (20000000 < credits_user_total > 10000000) {
    let ziel = 20000000 - credits_user_total;
        } else if (50000000 < credits_user_total > 20000000) {
    let ziel = 50000000 - credits_user_total;
        } else if (100000000 < credits_user_total > 50000000) {
    let ziel = 100000000 - credits_user_total;
        } else if (200000000 < credits_user_total > 100000000) {
    let ziel = 200000000 - credits_user_total;
        } else if (500000000 < credits_user_total > 200000000) {
    let ziel = 500000000 - credits_user_total;
        } else if (1000000000 < credits_user_total > 500000000) {
    let ziel = 1000000000 - credits_user_total;
        } else if (2000000000 < credits_user_total > 1000000000) {
    let ziel = 2000000000 - credits_user_total;
        } else if (5000000000 < credits_user_total > 2000000000) {
    let ziel = 5000000000 - credits_user_total;
        } else if (10000000000 < credits_user_total > 5000000000) {
    let ziel = 10000000000 - credits_user_total;
} else {
    let ziel = 0;
}


     const info = document.createElement("div");
    info.innerText = "Dir fehlen noch " + ziel + " Credits bis zum nächsten Rang";
    info.style.background = "#222";
    info.style.color = "white";
    info.style.padding = "10px";
    info.style.textAlign = "center";
    info.style.fontWeight = "bold";

    console.log("SKRIPT AKTIV");
})();
