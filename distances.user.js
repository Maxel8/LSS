// ==UserScript==
// @name         Gefahrene Kilometer
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  Zeigt eine Overlay-Tabelle mit Fahrzeug-Kilometerständen inkl. Summen und Ladebalken
// @author       Max8
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* ================= BUTTON ================= */
    function createFloatingButton() {
        if (document.getElementById('vehicle-distance-button')) return;

        const button = document.createElement('button');
        button.id = 'vehicle-distance-button';
        button.textContent = 'Fahrzeug-Kilometer';

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

        button.addEventListener('click', showOverlay);
        document.body.appendChild(button);
    }

    /* ================= OVERLAY ================= */
    function showOverlay() {
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

        const close = document.createElement('div');
        close.textContent = '✕';
        close.style.cssText = `
            position: fixed;
            top: 12px;
            right: 16px;
            font-size: 22px;
            font-weight: bold;
            cursor: pointer;
            user-select: none;
        `;
        close.onclick = () => overlay.remove();

        const title = document.createElement('h2');
        title.textContent = 'Fahrzeug-Kilometerstände';

        const progressWrapper = document.createElement('div');
        progressWrapper.style.cssText = 'width:100%;max-width:500px;margin:10px 0 20px 0;border:1px solid #ccc;height:18px;border-radius:4px;overflow:hidden;';

        const progressBar = document.createElement('div');
        progressBar.style.cssText = 'height:100%;width:0%;background:#5cb85c;transition:width 0.2s;';
        progressWrapper.appendChild(progressBar);

        const content = document.createElement('div');
        content.textContent = 'Lade Fahrzeugdaten…';

        overlay.appendChild(close);
        overlay.appendChild(title);
        overlay.appendChild(progressWrapper);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        loadAndRenderTable(content, progressBar);
    }

    /* ================= DATA ================= */
    async function loadAndRenderTable(container, progressBar) {
        try {
            const distRes = await fetch('/api/v1/vehicle_distances');
            const distJson = await distRes.json();
            const distances = distJson.result;

            let loaded = 0;
            const vehicles = [];

            for (const d of distances) {
                const res = await fetch(`/api/v2/vehicles/${d.vehicle_id}`);
                const json = await res.json();
                vehicles.push({
                    name: json.result.caption,
                    total: d.distance_km,
                    d30: d.distance_km_30d
                });

                loaded++;
                progressBar.style.width = `${Math.round((loaded / distances.length) * 100)}%`;
            }

            let sortKey = 'total';
            let sortAsc = false;
            vehicles.sort((a, b) => b.total - a.total);

            const sumTotal = vehicles.reduce((s, v) => s + v.total, 0);
            const sum30 = vehicles.reduce((s, v) => s + v.d30, 0);

            const table = document.createElement('table');
            table.style.cssText = 'border-collapse: collapse; width: 100%;';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Fahrzeug', 'Gesamt (km)', '30 Tage (km)'].forEach((txt, idx) => {
                const th = document.createElement('th');
                th.textContent = txt;
                th.style.cursor = 'pointer';
                th.onclick = () => {
                    if (idx === 1) sortKey = 'total';
                    else if (idx === 2) sortKey = 'd30';
                    sortAsc = !sortAsc;
                    vehicles.sort((a, b) => sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]);
                    renderTableBody();
                };
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            const tbody = document.createElement('tbody');

            function renderTableBody() {
                tbody.innerHTML = '';
                vehicles.forEach(v => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${v.name}</td>
                        <td>${v.total.toFixed(1)}</td>
                        <td>${v.d30.toFixed(1)}</td>
                    `;
                    tbody.appendChild(tr);
                });

                const sumRow = document.createElement('tr');
                sumRow.style.fontWeight = 'bold';
                sumRow.innerHTML = `
                    <td>SUMME</td>
                    <td>${sumTotal.toFixed(1)}</td>
                    <td>${sum30.toFixed(1)}</td>
                `;
                tbody.appendChild(sumRow);
            }

            renderTableBody();
            table.appendChild(thead);
            table.appendChild(tbody);

            container.innerHTML = '';
            container.appendChild(table);
        } catch (e) {
            console.error(e);
            container.textContent = 'Fehler beim Laden der Fahrzeugdaten.';
        }
    }

    /* ================= START ================= */
    createFloatingButton();
})();
