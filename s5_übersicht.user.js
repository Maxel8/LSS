// ==UserScript==
// @name         [LSS] Fahrzeuge im S5 auflisten
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Listet alle Fahrzeuge im Status 5 auf.
// @author       Caddy21 (bearbeitet durch Maxel8)
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      www.leitstellenspiel.de
// ==/UserScript==

(function () {
    'use strict';

    function getCurrentMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const defaultColors = {
        vehicleLink: getCurrentMode() === 'dark' ? '#007bff' : '#0056b3',
        buildingLink: getCurrentMode() === 'dark' ? '#007bff' : '#0056b3',
    };

    function saveColorsToLocalStorage(colors) {
        localStorage.setItem('customColors', JSON.stringify(colors));
    }

    function getColorsFromLocalStorage() {
        const savedColors = localStorage.getItem('customColors');
        return savedColors ? JSON.parse(savedColors) : { ...defaultColors };
    }

    const colors = getColorsFromLocalStorage();

    function insertButton() {
        const buildingPanelBody = document.querySelector('#building_panel_body');
        if (!buildingPanelBody) return;

        const button = document.createElement('button');
        button.textContent = 'Fahrzeuge im S5 anzeigen';
        button.classList.add('btn', 'btn-primary');

        button.addEventListener('click', () => {
            const loadingMessage = document.createElement('div');
            loadingMessage.id = 'loading-message';
            loadingMessage.textContent = 'Lade Fahrzeuge & Wachen...';
            loadingMessage.style.position = 'absolute';
            loadingMessage.style.top = '50%';
            loadingMessage.style.left = '50%';
            loadingMessage.style.transform = 'translate(-50%, -50%)';
            loadingMessage.style.fontSize = '24px';
            loadingMessage.style.fontWeight = 'bold';
            loadingMessage.style.zIndex = '10001';
            document.body.appendChild(loadingMessage);

            loadBuildingsAndVehiclesFiltered(loadingMessage);
        });

        buildingPanelBody.appendChild(button);
    }

    function loadBuildingsAndVehiclesFiltered(loadingMessage) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://www.leitstellenspiel.de/api/buildings',
            onload: function (response) {
                if (response.status !== 200) return;

                const buildings = JSON.parse(response.responseText);
                const buildingMap = {};
                buildings.forEach(b => buildingMap[b.id] = b.caption);

                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://www.leitstellenspiel.de/api/vehicles',
                    onload: function (vehicleResponse) {
                        if (vehicleResponse.status !== 200) return;

                        const vehicles = JSON.parse(vehicleResponse.responseText);
                        const status5Vehicles = vehicles.filter(v => v.fms_real === 5);

                        loadingMessage.remove();

                        if (status5Vehicles.length === 0) {
                            alert('Keine Fahrzeuge im Status 5 vorhanden.');
                            return;
                        }

                        openOverlay(status5Vehicles, buildingMap);
                    }
                });
            }
        });
    }

    function openOverlay(status5Vehicles, buildingMap) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = getCurrentMode() === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
        overlay.style.zIndex = '10000';
        overlay.style.padding = '20px';
        overlay.style.overflowY = 'auto';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Schließen';
        closeBtn.classList.add('btn', 'btn-danger');
        closeBtn.onclick = () => overlay.remove();

        const info = document.createElement('div');
        info.style.fontSize = '18px';
        info.style.fontWeight = 'bold';
        info.style.margin = '15px 0';
        info.textContent = `Gesamtzahl Fahrzeuge im Status 5: ${status5Vehicles.length}`;

        const table = document.createElement('table');
        table.classList.add('table', 'table-striped');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Wache</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');

        status5Vehicles.sort((a, b) => a.caption.localeCompare(b.caption));

        status5Vehicles.forEach(v => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="/vehicles/${v.id}" target="_blank" style="color:${colors.vehicleLink}">${v.caption}</a></td>
                <td><a href="/buildings/${v.building_id}" target="_blank" style="color:${colors.buildingLink}">${buildingMap[v.building_id] || 'Unbekannt'}</a></td>
                <td>${v.fms_real}</td>
            `;
            tbody.appendChild(tr);
        });

        overlay.appendChild(closeBtn);
        overlay.appendChild(info);
        overlay.appendChild(table);
        document.body.appendChild(overlay);
    }

    window.addEventListener('load', insertButton);
})();
