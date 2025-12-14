// ==UserScript==
// @name         Gefahrene Kilometer
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Erstellt eine Übersicht mit allen Fahrzeugen (Grundgerüst)
// @author       Max8
// @match        https://www.leitstellenspiel.de/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function createButton() {
        const menu = document.querySelector('#menu_profile + .dropdown-menu');
        if (!menu) return;

        const li = document.createElement('li');
        const button = document.createElement('a');

        button.href = '#';
        button.textContent = 'Kilometerstände aller Fahrzeuge anzeigen';

        button.addEventListener('click', (e) => {
            e.preventDefault();
            showDistances();
        });

        li.appendChild(button);
        menu.appendChild(li);
    }

    function showDistances() {
        if (document.getElementById('vehicle-distance-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'vehicle-distance-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: #ffffff;
            z-index: 9999;
            padding: 20px;
            overflow: auto;
            font-family: Arial, sans-serif;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Schließen';
        closeBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
        `;

        closeBtn.addEventListener('click', () => overlay.remove());

        const title = document.createElement('h2');
        title.textContent = 'Fahrzeug-Kilometerstände';

        const content = document.createElement('div');
        content.textContent = 'Hier kommen später die Fahrzeugdaten aus der API rein.';

        overlay.appendChild(closeBtn);
        overlay.appendChild(title);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    // Start
    createButton();
})();
