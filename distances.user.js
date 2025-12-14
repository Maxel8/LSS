// ==UserScript==
// @name         Gefahrene Kilometer
// @namespace    http://tampermonkey.net/
// @version      1.1.0
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

        const content = document.createElement('div');
        content.textContent = 'Lade Fahrzeugdaten…';
        overlay.appendChild(content);

        document.body.appendChild(overlay);

        loadAndRenderTable(content);
    }

    async function loadAndRenderTable(container) {
        try {
            const distRes = await fetch('/api/v1/vehicle_distances');
            const distJson = await distRes.json();

            const distances = distJson.result;

            // Fahrzeugdetails parallel laden
            const vehicles = await Promise.all(
                distances.map(async d => {
                    const res = await fetch(`/api/v2/vehicles/${d.vehicle_id}`);
                    const json = await res.json();
                    return {
                        name: json.result.caption,
                        total: d.distance_km,
                        d30: d.distance_km_30d
                    };
                })
            );

            // Absteigend nach Gesamtfahrleistung sortieren
            vehicles.sort((a, b) => b.total - a.total);

            // Tabelle bauen
            const table = document.createElement('table');
            table.style.cssText = 'border-collapse: collapse; width: 100%;';

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Fahrzeug</th>
                    <th>Gesamt (km)</th>
                    <th>30 Tage (km)</th>
                </tr>
            `;

            const tbody = document.createElement('tbody');

            vehicles.forEach(v => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${v.name}</td>
                    <td>${v.total.toFixed(1)}</td>
                    <td>${v.d30.toFixed(1)}</td>
                `;
                tbody.appendChild(tr);
            });

            table.appendChild(thead);
            table.appendChild(tbody);

            container.innerHTML = '';
            container.appendChild(table);

        } catch (err) {
            container.textContent = 'Fehler beim Laden der Fahrzeugdaten.';
            console.error(err);
        }
    }

    // Start
    createFloatingButton();
})();
