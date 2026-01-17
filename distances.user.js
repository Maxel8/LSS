// ==UserScript==
// @name         Gefahrene Kilometer (Cache + Gebäude)
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Fahrzeug-Kilometer mit Cache, Gebäudenamen & sortierbaren Spalten
// @author       Max8
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* ================= CONFIG ================= */
    const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 Stunden
    const LS = {
        vehicles: 'km_cache_vehicles',
        buildings: 'km_cache_buildings',
        tsVehicles: 'km_cache_vehicles_ts',
        tsBuildings: 'km_cache_buildings_ts'
    };

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
            font-size: 13px;`;

        button.onclick = showOverlay;
        document.body.appendChild(button);
    }

    /* ================= OVERLAY ================= */
    function showOverlay() {
        if (document.getElementById('vehicle-distance-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'vehicle-distance-overlay';
        overlay.style.cssText = `position:fixed;inset:0;background:#fff;z-index:10000;padding:20px;overflow:auto;`;

        const close = document.createElement('div');
        close.textContent = '✕';
        close.style.cssText = 'position:fixed;top:12px;right:16px;font-size:22px;cursor:pointer;';
        close.onclick = () => overlay.remove();

        const title = document.createElement('h2');
        title.textContent = 'Fahrzeug-Kilometerstände';

        const progressWrapper = document.createElement('div');
        progressWrapper.style.cssText = 'width:100%;max-width:500px;margin:10px 0 20px;border:1px solid #ccc;height:18px;border-radius:4px;overflow:hidden;';
        const progressBar = document.createElement('div');
        progressBar.style.cssText = 'height:100%;width:0%;background:#5cb85c;transition:width .2s;';
        progressWrapper.appendChild(progressBar);

        const content = document.createElement('div');
        content.textContent = 'Lade Daten…';

        overlay.append(close, title, progressWrapper, content);
        document.body.appendChild(overlay);

        loadAndRenderTable(content, progressBar);
    }

    /* ================= CACHE HELPERS ================= */
    function isCacheValid(tsKey) {
        const ts = Number(localStorage.getItem(tsKey));
        return ts && (Date.now() - ts < CACHE_TTL);
    }

    /* ================= DATA ================= */
    async function getBuildings() {
        if (isCacheValid(LS.tsBuildings)) {
            return JSON.parse(localStorage.getItem(LS.buildings));
        }
        const res = await fetch('/api/buildings');
        const json = await res.json();
        const map = {};
        json.forEach(b => map[b.id] = b.caption);
        localStorage.setItem(LS.buildings, JSON.stringify(map));
        localStorage.setItem(LS.tsBuildings, Date.now());
        return map;
    }

    async function getVehicles(distances, progressBar) {
        if (isCacheValid(LS.tsVehicles)) {
            return JSON.parse(localStorage.getItem(LS.vehicles));
        }

        const vehicles = [];
        let loaded = 0;

        for (const d of distances) {
            const res = await fetch(`/api/v2/vehicles/${d.vehicle_id}`);
            const json = await res.json();
            vehicles.push({
                id: d.vehicle_id,
                name: json.result.caption,
                building_id: json.result.building_id,
                total: d.distance_km,
                d30: d.distance_km_30d
            });
            loaded++;
            progressBar.style.width = `${Math.round((loaded / distances.length) * 100)}%`;
        }

        localStorage.setItem(LS.vehicles, JSON.stringify(vehicles));
        localStorage.setItem(LS.tsVehicles, Date.now());
        return vehicles;
    }

    async function loadAndRenderTable(container, progressBar) {
        try {
            const [distRes, buildings] = await Promise.all([
                fetch('/api/v1/vehicle_distances'),
                getBuildings()
            ]);

            const distJson = await distRes.json();
            let vehicles = await getVehicles(distJson.result, progressBar);

            vehicles.forEach(v => v.building = buildings[v.building_id] || '–');

            let sortKey = 'total';
            let sortAsc = false;

            const table = document.createElement('table');
            table.style.cssText = 'border-collapse:collapse;width:100%;';

            const headers = [
                { key: 'name', label: 'Fahrzeug' },
                { key: 'building', label: 'Gebäude' },
                { key: 'total', label: 'Gesamt (km)' },
                { key: 'd30', label: '30 Tage (km)' }
            ];

            const thead = document.createElement('thead');
            const hr = document.createElement('tr');
            headers.forEach(h => {
                const th = document.createElement('th');
                th.textContent = h.label;
                th.style.cursor = h.key === 'total' || h.key === 'd30' ? 'pointer' : 'default';
                if (h.key === 'total' || h.key === 'd30') {
                    th.onclick = () => {
                        sortKey = h.key;
                        sortAsc = !sortAsc;
                        vehicles.sort((a, b) => sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]);
                        renderBody();
                    };
                }
                hr.appendChild(th);
            });
            thead.appendChild(hr);

            const tbody = document.createElement('tbody');

            function renderBody() {
                tbody.innerHTML = '';
                vehicles.forEach(v => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${v.name}</td>
                        <td>${v.building}</td>
                        <td>${v.total.toFixed(1)}</td>
                        <td>${v.d30.toFixed(1)}</td>`;
                    tbody.appendChild(tr);
                });
            }

            vehicles.sort((a, b) => b.total - a.total);
            renderBody();

            table.append(thead, tbody);
            container.innerHTML = '';
            container.appendChild(table);
        } catch (e) {
            console.error(e);
            container.textContent = 'Fehler beim Laden der Daten.';
        }
    }

    createFloatingButton();
})();
