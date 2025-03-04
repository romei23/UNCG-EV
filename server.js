const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));  // Serves files from the 'public' directory

const chargers = [
    { id: 1, location: 'McIver Charger 1', status: 'Available' },
    { id: 2, location: 'McIver Charger 2', status: 'In Use' },
    { id: 2, location: 'McIver Charger 3', status: 'In Use' },
    { id: 2, location: 'McIver Charger 4', status: 'Available' },
    { id: 2, location: 'Oakland Charger 1', status: 'In Use' },
    { id: 2, location: 'Oakland Charger 2', status: 'Available' },
    { id: 2, location: 'Oakland Charger 3', status: 'Available' },
    { id: 2, location: 'Oakland Charger 4', status: 'Available' },
    { id: 2, location: 'Nursing Charger 1', status: 'In Use' },
    { id: 2, location: 'Nursing Charger 2', status: 'In Use' },
    { id: 2, location: 'Nursing Charger 3', status: 'In Use' },
    { id: 2, location: 'Nursing Charger 4', status: 'In Use' }
];

app.get('/api/chargers', (req, res) => {
    res.json(chargers);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
