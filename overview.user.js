// ==UserScript==
// @name         [LSS] Overview
// @namespace    http://tampermonkey.net/
// @version      v0.5
// @description  Dashboard for LSS
// @author       Max8
// @match        https://www.leitstellenspiel.de/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const API_BASE = 'https://www.leitstellenspiel.de/api';

    let vehicleCache = new Map();
    let buildingCache = new Map();

    function init() {
        addMenuButton();
    }

    function addMenuButton() {
        const profileRoot = document.querySelector('#menu_profile');

        if (!profileRoot) {
            setTimeout(addMenuButton, 500);
            return;
        }

        const profileMenu = profileRoot.parentElement.querySelector('.dropdown-menu');

        if (!profileMenu) {
            setTimeout(addMenuButton, 500);
            return;
        }

        if (profileMenu.querySelector('#open-overview-overlay')) return;

        const menuButton = document.createElement('li');
        menuButton.setAttribute('role', 'presentation');

        const link = document.createElement('a');
        link.id = 'open-overview-overlay';
        link.href = '#';
        link.innerHTML = `<span class="glyphicon glyphicon-th-large"></span>&nbsp;&nbsp; Overview`;

        link.addEventListener('click', async (e) => {
            e.preventDefault();
            await openOverlay();
        });

        menuButton.appendChild(link);

        const firstItem = profileMenu.firstElementChild;
        if (firstItem) {
            profileMenu.insertBefore(menuButton, firstItem);
        } else {
            profileMenu.appendChild(menuButton);
        }
    }

    async function openOverlay() {
        if (document.getElementById('overview-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'overview-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            zIndex: '99999',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        });

        const content = document.createElement('div');
        Object.assign(content.style, {
            width: '92%',
            height: '90%',
            background: '#1e1e1e',
            borderRadius: '10px',
            padding: '20px',
            color: 'white',
            overflow: 'auto',
            boxSizing: 'border-box',
            boxShadow: '0 0 30px rgba(0,0,0,0.45)'
        });

        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:12px;">
                <h2 style="margin:0;">Overview</h2>
                <button id="overview-close-btn" style="padding:8px 12px; border:0; border-radius:8px; cursor:pointer; background-color: green; color: white">Schließen</button>
            </div>
            <div id="overview-status" style="margin-bottom:12px; opacity:0.85;">Lade Daten...</div>
            <div id="overview-content"></div>
        `;

        overlay.addEventListener('click', () => overlay.remove());
        content.addEventListener('click', (e) => e.stopPropagation());

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        content.querySelector('#overview-close-btn').addEventListener('click', () => overlay.remove());

        try {
            const data = await loadOverviewData();
            renderOverview(content.querySelector('#overview-content'), data);
            content.querySelector('#overview-status').textContent = 'Daten geladen.';
        } catch (error) {
            console.error(error);
            content.querySelector('#overview-status').textContent = 'Fehler beim Laden der Daten.';
            content.querySelector('#overview-content').innerHTML = `<pre style="white-space:pre-wrap; color:#ffb3b3;">${escapeHtml(String(error))}</pre>`;
        }
    }

    async function loadOverviewData() {
        const distancesResponse = await fetch(`${API_BASE}/v1/vehicle_distances`, {
            credentials: 'include'
        });

        if (!distancesResponse.ok) {
            throw new Error(`vehicle_distances konnte nicht geladen werden (${distancesResponse.status})`);
        }

        const distancesJson = await distancesResponse.json();
        const distances = Array.isArray(distancesJson.result) ? distancesJson.result : [];

        const totals = distances.reduce((acc, item) => {
            acc.total += Number(item.distance_km || 0);
            acc.d30 += Number(item.distance_km_30d || 0);
            return acc;
        }, { total: 0, d30: 0 });

        const topByTotal = [...distances]
            .sort((a, b) => (b.distance_km || 0) - (a.distance_km || 0))
            .slice(0, 5);

        const topBy30d = [...distances]
            .sort((a, b) => (b.distance_km_30d || 0) - (a.distance_km_30d || 0))
            .slice(0, 5);

        const uniqueIds = [...new Set([
            ...topByTotal.map(x => x.vehicle_id),
            ...topBy30d.map(x => x.vehicle_id)
        ])];

        await Promise.all(uniqueIds.map(fetchVehicleDetails));

        const topVehicleIds = new Set(uniqueIds);
        const buildingIds = new Set();

        for (const id of topVehicleIds) {
            const vehicle = vehicleCache.get(id);
            if (vehicle && vehicle.building_id != null) {
                buildingIds.add(vehicle.building_id);
            }
        }

        await Promise.all([...buildingIds].map(fetchBuildingDetails));

        return {
            topByTotal,
            topBy30d,
            totals
        };
    }

    async function fetchVehicleDetails(vehicleId) {
        if (vehicleCache.has(vehicleId)) return vehicleCache.get(vehicleId);

        const response = await fetch(`${API_BASE}/v2/vehicles/${vehicleId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Fahrzeug ${vehicleId} konnte nicht geladen werden (${response.status})`);
        }

        const json = await response.json();
        const vehicle = json.result;
        vehicleCache.set(vehicleId, vehicle);
        return vehicle;
    }

    async function fetchBuildingDetails(buildingId) {
        if (buildingCache.has(buildingId)) return buildingCache.get(buildingId);

        const response = await fetch(`${API_BASE}/buildings/${buildingId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Gebäude ${buildingId} konnte nicht geladen werden (${response.status})`);
        }

        const json = await response.json();
        buildingCache.set(buildingId, json);
        return json;
    }

    function renderOverview(container, data) {
        const totalRows = data.topByTotal.map((item, index) => renderRow(index + 1, item));
        const d30Rows = data.topBy30d.map((item, index) => renderRow(index + 1, item));

        const total = Number(data.totals?.total || 0);
        const d30 = Number(data.totals?.d30 || 0);
        const share = total > 0 ? ((d30 * 100) / total).toFixed(2) + ' %' : '0.00 %';

        container.innerHTML = `
            <style>
                .overview-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 22px;
                    font-size: 14px;
                }
                .overview-table th, .overview-table td {
                    border: 1px solid rgba(255,255,255,0.12);
                    padding: 8px 10px;
                    text-align: left;
                    vertical-align: top;
                }
                .overview-table th {
                    background: rgba(255,255,255,0.08);
                }
                .overview-section {
                    margin-bottom: 28px;
                }
                .overview-section h3 {
                    margin: 0 0 10px 0;
                }
                .overview-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .summary-card {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 10px;
                    padding: 14px 16px;
                }
                .summary-label {
                    font-size: 13px;
                    opacity: 0.8;
                    margin-bottom: 6px;
                }
                .summary-value {
                    font-size: 22px;
                    font-weight: 700;
                }
            </style>

            <div class="overview-section">
                <h3>Gesamtstatistik</h3>
                <div class="overview-summary">
                    <div class="summary-card">
                        <div class="summary-label">Gesamte Fahrleistung</div>
                        <div class="summary-value">${formatKm(total)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Fahrleistung der letzten 30 Tage</div>
                        <div class="summary-value">${formatKm(d30)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Anteil 30 Tage an gesamt</div>
                        <div class="summary-value">${share}</div>
                    </div>
                </div>
            </div>

            <div class="overview-section">
                <h3>Top 5 Fahrzeuge gesamt</h3>
                ${buildTable(totalRows)}
            </div>

            <div class="overview-section">
                <h3>Top 5 Fahrzeuge der letzten 30 Tage</h3>
                ${buildTable(d30Rows)}
            </div>
        `;
    }

    function buildTable(rowsHtml) {
        return `
            <table class="overview-table">
                <thead>
                    <tr>
                        <th>Platz</th>
                        <th>Fahrzeugname</th>
                        <th>Gebäudename</th>
                        <th>Fahrleistung</th>
                        <th>30 Tage</th>
                        <th>Anteil</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml.join('')}
                </tbody>
            </table>
        `;
    }

    function renderRow(place, item) {
        const vehicle = vehicleCache.get(item.vehicle_id);
        const building = vehicle && vehicle.building_id != null ? buildingCache.get(vehicle.building_id) : null;

        const vehicleName = vehicle?.caption ?? `Fahrzeug ${item.vehicle_id}`;
        const buildingName = building?.caption ?? (vehicle?.building_id != null ? `Gebäude ${vehicle.building_id}` : '-');
        const total = Number(item.distance_km || 0);
        const d30 = Number(item.distance_km_30d || 0);
        const share = total > 0 ? ((d30 * 100) / total).toFixed(2) + ' %' : '0.00 %';

        return `
            <tr>
                <td>${place}</td>
                <td>${escapeHtml(vehicleName)}</td>
                <td>${escapeHtml(buildingName)}</td>
                <td>${formatKm(total)}</td>
                <td>${formatKm(d30)}</td>
                <td>${share}</td>
            </tr>
        `;
    }

    function formatKm(value) {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value) + ' km';
    }

    function escapeHtml(text) {
        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    window.addEventListener('load', init);
})();
