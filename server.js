const WebSocket = require('ws');
const express = require('express');
const app = express();
const port = 3000;

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', socket => {
    socket.on('message', message => {
        const timestamp = new Date().toLocaleString(); // Get the current date and time
        const messageWithTimestamp = `${message}    -${timestamp}`;

        // Broadcast the message with the timestamp to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageWithTimestamp);
            }
        });
    });
});

// Express server setup
app.use(express.json());

app.get('/api/charger-locations', (req, res) => {
    const locations = [
        { id: 1, name: "Charger 1", lat: 36.0726, lng: -79.7910 },
        { id: 2, name: "Charger 2", lat: 36.0730, lng: -79.7920 },
        // Add more charger locations as needed
    ];
    res.json(locations);
});

const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:3000`);
});

// Upgrade HTTP server to handle WebSocket connections
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
        wss.emit('connection', socket, request);
    });
});