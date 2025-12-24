// ==UserScript==
// @name         BOS-Fahrzeuge Kreisgrenzen (Google Maps)
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  Zeigt deutsche Kreisgrenzen auf der Google-Map von bos-fahrzeuge.de
// @author       Max8
// @match        https://www.bos-fahrzeuge.de/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';


  const GEOJSON_URL = 'https://raw.githubusercontent.com/jalibu/LSHeat/master/kreise.json';

  function waitForMap(cb) {
    const i = setInterval(() => {
      if (window.google && window.google.maps && window.map) {
        clearInterval(i);
        cb(window.map);
      }
    }, 500);
  }

  waitForMap((map) => {
    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then(geojson => {
        geojson.features.forEach(f => {
          const paths = f.geometry.coordinates.map(poly =>
            poly[0].map(c => ({ lat: c[1], lng: c[0] }))
          );

          new google.maps.Polygon({
            paths: paths,
            strokeColor: '#ff0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillOpacity: 0,
            map: map
          });
        });
      });
  });
})();
