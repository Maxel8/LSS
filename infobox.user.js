// ==UserScript==
// @name         Infobox
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Fügt einen Header mit Credit-Ziel und Platzierung in der Topliste ein und aktualisiert automatisch.
// @author       Max8
// @match        https://www.leitstellenspiel.de/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const apiUrl = "https://www.leitstellenspiel.de/api/userinfo";

    const info = document.createElement("div");
    info.style.background = "#222";
    info.style.color = "white";
    info.style.padding = "10px";
    info.style.textAlign = "center";
    info.style.fontWeight = "bold";
    info.style.zIndex = "9999";
    document.body.prepend(info);

    async function updateCredits() {
        try {
            const response = await fetch(apiUrl, { credentials: "include" });
            const data = await response.json();

            const credits_user_total = data.credits_user_total;
            const toplistPosition = data.user_toplist_position;

            const targets = [
                200, 10000, 100000, 1000000, 5000000, 10000000,
                20000000, 50000000, 100000000, 200000000,
                500000000, 1000000000, 2000000000, 5000000000
            ];

            let ziel = targets.find(t => credits_user_total < t) || null;
            let zielText = "Maximalrang erreicht";

            if (ziel !== null) {
                ziel = (ziel - credits_user_total).toLocaleString('de-DE');
                zielText = `Dir fehlen noch ${ziel} Credits bis zum nächsten Rang.`;
            }

            const platzierungText = toplistPosition
                ? `Aktuelle Platzierung: #${toplistPosition.toLocaleString('de-DE')}`
                : "Platzierung nicht verfügbar";

            info.innerText = `${zielText} | ${platzierungText}`;

        } catch (error) {
            console.error("Fehler beim Laden der API:", error);
            info.innerText = "Fehler beim Laden der Spielerdaten";
        }
    }

    updateCredits();
    setInterval(updateCredits, 120000); // alle 2 Minuten
})();
