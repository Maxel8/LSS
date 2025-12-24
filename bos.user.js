// ==UserScript==
// @name         BOS-Fahrzeuge – Kreisgrenzen Overlay
// @namespace    http://tampermonkey.net/
// @version      0.2.0
// @match        https://www.bos-fahrzeuge.info/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let capturedMap = null;

    const waitForGoogle = setInterval(() => {
        if (window.google && google.maps && google.maps.Map) {
            clearInterval(waitForGoogle);

            const OriginalMap = google.maps.Map;

            google.maps.Map = function (...args) {
                const map = new OriginalMap(...args);
                capturedMap = map;

                // leicht verzögert, damit die Seite fertig initialisiert ist
                setTimeout(() => drawKreisgrenzen(map), 1500);

                return map;
            };
        }
    }, 200);

    function drawKreisgrenzen(map) {
        fetch('https://raw.githubusercontent.com/jalibu/LSHeat/master/kreise.json')
            .then(r => r.json())
            .then(geo => {
                geo.features.forEach(f => {
                    f.geometry.coordinates.forEach(poly => {
                        const path = poly[0].map(c => ({
                            lat: c[1],
                            lng: c[0]
                        }));

                        new google.maps.Polygon({
                            paths: path,
                            strokeColor: '#cc0000',
                            strokeOpacity: 0.7,
                            strokeWeight: 1,
                            fillOpacity: 0,
                            map: map
                        });
                    });
                });
            });
    }
})();
