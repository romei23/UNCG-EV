require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { DateTime } = require("luxon"); // Handles timezone conversion

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Fetch all chargers
app.get('/chargers', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT chargerid, location, status FROM chargers');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  Book a charger (Convert EST to UTC before saving)
app.post('/reservations', async (req, res) => {
    const { chargerid, starttime, endtime } = req.body;

    console.log("Received booking request:", { chargerid, starttime, endtime });

    try {
        // Convert from EST to UTC before storing in PostgreSQL
        const start = DateTime.fromISO(starttime, { zone: "America/New_York" }).toUTC().toISO();
        const end = DateTime.fromISO(endtime, { zone: "America/New_York" }).toUTC().toISO();

        // Check if charger exists
        const checkCharger = await pool.query('SELECT status FROM chargers WHERE chargerid = $1', [chargerid]);
        if (checkCharger.rows.length === 0) {
            return res.status(404).json({ message: "Charger not found." });
        }

        if (checkCharger.rows[0].status !== 'Available') {
            return res.status(400).json({ message: "Charger is already in use." });
        }

        // Insert reservation with UTC time
        await pool.query(
            'INSERT INTO reservations (chargerid, starttime, endtime) VALUES ($1, $2, $3)',
            [chargerid, start, end]
        );

        await pool.query('UPDATE chargers SET status = $1 WHERE chargerid = $2', ['In Use', chargerid]);

        console.log(" Booking stored in UTC successfully!");
        res.status(201).json({ message: "Charger booked successfully!" });

    } catch (err) {
        console.error("Error booking charger:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

//  Fetch all reservations with charger names
app.get('/reservations', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT r.reservationid, r.chargerid, r.starttime, r.endtime, c.location 
            FROM reservations r 
            JOIN chargers c ON r.chargerid = c.chargerid
        `);

        console.log(" Sent Reservations Data:", rows); // Debugging
        res.json(rows);
    } catch (err) {
        console.error("Error fetching reservations:", err);
        res.status(500).json({ error: err.message });
    }
});



// ✅ Cancel a booking
app.delete('/reservations/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Get charger ID before deleting
        const reservation = await pool.query('SELECT chargerid FROM reservations WHERE reservationid = $1', [id]);
        if (reservation.rows.length === 0) {
            return res.status(404).json({ message: "Reservation not found." });
        }

        const chargerid = reservation.rows[0].chargerid;

        // Delete the reservation
        await pool.query('DELETE FROM reservations WHERE reservationid = $1', [id]);

        // Check if this was the only reservation for this charger
        const otherReservations = await pool.query('SELECT * FROM reservations WHERE chargerid = $1', [chargerid]);
        if (otherReservations.rows.length === 0) {
            await pool.query('UPDATE chargers SET status = $1 WHERE chargerid = $2', ['Available', chargerid]);
        }

        console.log(`✅ Reservation ${id} canceled. Charger ${chargerid} is now available.`);
        res.json({ message: "Reservation canceled, charger is now available." });

    } catch (err) {
        console.error("❌ Error canceling reservation:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
