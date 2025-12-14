// ==UserScript==
// @name         Gefahrene Kilometer
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Erstellt eine Übersicht mit allen Fahrzeugen.
// @author       Max8
// @match        https://www.leitstellenspiel.de/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

     function showdistances() {
        var buttonContainer = document.createElement('li');
        var distanceButton = document.createElement('a');
        gridButton.href = '#';
        gridButton.textContent = 'Kilometerstände aller Fahrzeuge anzeigen';
        gridButton.addEventListener('click', function() {

            
        });
         
buttonContainer.appendChild(distanceButton);

        document
            .querySelector('#menu_profile + .dropdown-menu > li.divider')
            ?.before(buttonContainer);

    
})();
