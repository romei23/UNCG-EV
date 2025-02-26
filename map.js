document.addEventListener("DOMContentLoaded", function () {
    // Initialize the map
    var map = L.map('map').setView([36.0687, -79.8104], 15); // UNCG coordinates

    // Load the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add a marker at UNCG EV charging station
    L.marker([36.0687, -79.8104]).addTo(map)
        .bindPopup('UNC Greensboro - EV Charging Stations')
        .openPopup();
});
