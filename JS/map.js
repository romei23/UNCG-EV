// Initialize the Leaflet map centered on UNCG
var map = L.map('map').setView([36.0687, -79.8072], 15); // Centered on UNCG

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Charging station locations with numbers
var chargers = [
    { id: 1, name: "UNCG Parking Deck (Walker Ave)", lat: 36.0687, lng: -79.8072 },
    { id: 2, name: "Oakland Ave Parking Deck", lat: 36.0703, lng: -79.8090 },
    { id: 3, name: "Spring Garden St Lot", lat: 36.0682, lng: -79.8055 },
    { id: 4, name: "Sullivan Science Parking Lot", lat: 36.0675, lng: -79.8102 }
];

// Function to open directions in OpenStreetMap
function openDirections(lat, lng) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

// Add markers for each charging station
chargers.forEach(station => {
    L.marker([station.lat, station.lng])
        .addTo(map)
        .bindPopup(`
            <b>${station.name}</b><br>
            EV Charging Available.<br>
            <button onclick="openDirections(${station.lat}, ${station.lng})" 
                style="margin-top:5px; padding:5px 10px; background:#0f2044; color:white; border:none; cursor:pointer;">
                Get Directions
            </button>
        `); // Popup content with station name and a button to get directions
});
