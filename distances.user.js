// ==UserScript==
// @name         Gefahrene Kilometer
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Erstellt eine Übersicht mit allen Fahrzeugen (Button unten rechts)
// @author       Max8
// @match        https://www.leitstellenspiel.de/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function createFloatingButton() {
        if (document.getElementById('vehicle-distance-button')) return;

        const button = document.createElement('button');
        button.id = 'vehicle-distance-button';
        button.textContent = 'Fahrzeug‑Kilometer';

        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            padding: 10px 14px;
            background: #d9534f;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
        `;

        button.addEventListener('click', showDistances);
        document.body.appendChild(button);
    }

    function showDistances() {
        if (document.getElementById('vehicle-distance-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'vehicle-distance-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: #ffffff;
            z-index: 10000;
            padding: 20px;
            overflow: auto;
            font-family: Arial, sans-serif;
        `;

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `
            position: fixed;
            top: 12px;
            right: 16px;
            font-size: 22px;
            font-weight: bold;
            cursor: pointer;
            color: #333;
            user-select: none;
        `;

        closeBtn.addEventListener('click', () => overlay.remove());

        overlay.appendChild(closeBtn);
        overlay.appendChild(title);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    // Start
    createFloatingButton();
})();
