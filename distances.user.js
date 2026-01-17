// ==UserScript==
// @name         Gefahrene Kilometer
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  Fahrzeug-Kilometer mit inkrementellem Cache, Gebäudenamen & sortierbaren Spalten
// @author       Max8
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /* ================= CONFIG ================= */
    const TTL = {
        vehicles: 1000 * 60 * 60 * 6,     // 6h
        buildings: 1000 * 60 * 60 * 24    // 24h
    };

    const LS = {
        vehicles: 'km_cache_vehicles',
        vehiclesTS: 'km_cache_vehicles_ts',
        buildings: 'km_cache_buildings',
        buildingsTS: 'km_cache_buildings_ts'
    };

    /* ================= UTILS ================= */
    const cacheValid = (k, ttl) => {
        const ts = Number(localStorage.getItem(k));
        return ts && Date.now() - ts < ttl;
    };

    /* ================= BUTTON ================= */
    function createButton() {
        if (document.getElementById('vehicle-distance-button')) return;
        const b = document.createElement('button');
        b.id = 'vehicle-distance-button';
        b.textContent = 'Fahrzeug-Kilometer';
        b.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 14px;background:#d9534f;color:#fff;border:none;border-radius:6px;cursor:pointer;';
        b.onclick = showOverlay;
        document.body.appendChild(b);
    }

    /* ================= OVERLAY ================= */
    function showOverlay() {
        if (document.getElementById('vehicle-distance-overlay')) return;

        const o = document.createElement('div');
        o.id = 'vehicle-distance-overlay';
        o.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:10000;padding:20px;overflow:auto;';

        const close = document.createElement('div');
        close.textContent = '✕';
        close.style.cssText = 'position:fixed;top:12px;right:16px;font-size:22px;cursor:pointer;';
        close.onclick = () => o.remove();

        const h = document.createElement('h2');
        h.textContent = 'Fahrzeug-Kilometerstände';

        const pWrap = document.createElement('div');
        pWrap.style.cssText = 'width:100%;max-width:500px;margin:10px 0 20px;border:1px solid #ccc;height:18px;border-radius:4px;overflow:hidden;';
        const pBar = document.createElement('div');
        pBar.style.cssText = 'height:100%;width:0%;background:#5cb85c;transition:width .2s;';
        pWrap.appendChild(pBar);

        const c = document.createElement('div');
        c.textContent = 'Lade Daten…';

        o.append(close, h, pWrap, c);
        document.body.appendChild(o);

        loadAndRender(c, pBar);
    }

    /* ================= BUILDINGS ================= */
    async function getBuildings() {
        if (cacheValid(LS.buildingsTS, TTL.buildings)) {
            return JSON.parse(localStorage.getItem(LS.buildings));
        }
        const r = await fetch('/api/buildings');
        const j = await r.json();
        const map = {};
        j.forEach(b => map[b.id] = b.caption);
        localStorage.setItem(LS.buildings, JSON.stringify(map));
        localStorage.setItem(LS.buildingsTS, Date.now());
        return map;
    }

    /* ================= VEHICLES ================= */
    async function getVehicles(distances, progressBar) {
        let vehicles = [];
        if (cacheValid(LS.vehiclesTS, TTL.vehicles)) {
            vehicles = JSON.parse(localStorage.getItem(LS.vehicles)) || [];
        }

        const known = new Set(vehicles.map(v => v.id));
        const needed = distances.map(d => d.vehicle_id);

        const missing = needed.filter(id => !known.has(id));

        for (let i = 0; i < missing.length; i++) {
            const id = missing[i];
            const r = await fetch(`/api/v2/vehicles/${id}`);
            const j = await r.json();
            vehicles.push({
                id,
                name: j.result.caption,
                building_id: j.result.building_id
            });
            progressBar.style.width = `${Math.round(((i + 1) / missing.length) * 100)}%`;
        }

        vehicles = vehicles.filter(v => needed.includes(v.id));

        localStorage.setItem(LS.vehicles, JSON.stringify(vehicles));
        localStorage.setItem(LS.vehiclesTS, Date.now());
        return vehicles;
    }

    /* ================= MAIN ================= */
    async function loadAndRender(container, progressBar) {
        try {
            const distRes = await fetch('/api/v1/vehicle_distances');
            const distJson = await distRes.json();
            const distances = distJson.result;

            const [vehicles, buildings] = await Promise.all([
                getVehicles(distances, progressBar),
                getBuildings()
            ]);

            const rows = vehicles.map(v => {
                const d = distances.find(x => x.vehicle_id === v.id);
                return {
                    name: v.name,
                    building: buildings[v.building_id] || '–',
                    total: d.distance_km,
                    d30: d.distance_km_30d
                };
            });

            let sortKey = 'total', sortAsc = false;

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
                th.style.cursor = 'pointer';
                th.onclick = () => {
                    sortKey = h.key;
                    sortAsc = !sortAsc;
                    rows.sort((a, b) => {
                        if (typeof a[sortKey] === 'string') {
                            return sortAsc
                                ? a[sortKey].localeCompare(b[sortKey])
                                : b[sortKey].localeCompare(a[sortKey]);
                        }
                        return sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
                    });
                    renderBody();
                };
                hr.appendChild(th);
            });
            thead.appendChild(hr);

            const tbody = document.createElement('tbody');

            function renderBody() {
                tbody.innerHTML = '';
                rows.forEach(r => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${r.name}</td><td>${r.building}</td><td>${r.total.toFixed(1)}</td><td>${r.d30.toFixed(1)}</td>`;
                    tbody.appendChild(tr);
                });
            }

            rows.sort((a, b) => b.total - a.total);
            renderBody();

            table.append(thead, tbody);
            container.innerHTML = '';
            container.appendChild(table);
        } catch (e) {
            console.error(e);
            container.textContent = 'Fehler beim Laden der Daten.';
        }
    }

    createButton();
})();
