// Initialize the Leaflet map
var map = L.map('map').setView([36.0726, -79.7910], 14); // UNCG Area

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Add charging station markers
var chargers = [
    { id: 1, name: "Walmart 5320 - Greensboro", lat: 36.0726, lng: -79.7910 },
    { id: 2, name: "UNCG Parking Garage", lat: 36.0730, lng: -79.7920 }
];

chargers.forEach(station => {
    L.marker([station.lat, station.lng])
        .addTo(map)
        .bindPopup(`<b>${station.name}</b><br>EV Charging Available.`);
});
