require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const { DateTime } = require("luxon");

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

// ✅ Fetch all chargers
app.get('/chargers', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT chargerid, location, status FROM chargers');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Book a charger (Handles Time Zones)
app.post('/reservations', async (req, res) => {
    const { chargerid, starttime, endtime } = req.body;
    console.log("Received booking request:", { chargerid, starttime, endtime });

    try {
        const start = DateTime.fromISO(starttime, { zone: "America/New_York" }).toUTC().toISO();
        const end = DateTime.fromISO(endtime, { zone: "America/New_York" }).toUTC().toISO();

        const checkCharger = await pool.query('SELECT status FROM chargers WHERE chargerid = $1', [chargerid]);
        if (checkCharger.rows.length === 0) {
            return res.status(404).json({ message: "Charger not found." });
        }

        // ✅ Ensure charger isn't already booked during this time
        const conflict = await pool.query(`
            SELECT * FROM reservations 
            WHERE chargerid = $1 AND (
                (starttime < $3 AND endtime > $2)
            )
        `, [chargerid, start, end]);

        if (conflict.rows.length > 0) {
            return res.status(400).json({ message: "This charger is already booked at the selected time." });
        }

        await pool.query(
            'INSERT INTO reservations (chargerid, starttime, endtime) VALUES ($1, $2, $3)',
            [chargerid, start, end]
        );

        console.log("✅ Booking stored successfully!");
        res.status(201).json({ message: "Charger booked successfully!" });

    } catch (err) {
        console.error("❌ Error booking charger:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

// ✅ Fetch all reservations with charger names
app.get('/reservations', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT r.reservationid, r.chargerid, r.starttime, r.endtime, c.location 
            FROM reservations r 
            JOIN chargers c ON r.chargerid = c.chargerid
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Cancel a booking
app.delete('/reservations/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM reservations WHERE reservationid = $1', [id]);
        res.json({ message: "Reservation canceled." });

    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
// ✅ Update an existing reservation
// ✅ Update an existing reservation
// ✅ Update an existing reservation
app.put('/reservations/:id', async (req, res) => {
    const { id } = req.params;
    const { chargerid, starttime, endtime } = req.body;

    try {
        // Check if reservation exists
        const checkReservation = await pool.query('SELECT * FROM reservations WHERE reservationid = $1', [id]);
        if (checkReservation.rows.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Convert from EST to UTC
        const start = DateTime.fromISO(starttime, { zone: "America/New_York" }).toUTC().toISO();
        const end = DateTime.fromISO(endtime, { zone: "America/New_York" }).toUTC().toISO();

        // ✅ Check for conflicts before updating
        const conflict = await pool.query(`
            SELECT * FROM reservations
            WHERE chargerid = $1 AND reservationid != $2
              AND ((starttime < $3 AND endtime > $2))
        `, [chargerid, id, start, end]);

        if (conflict.rows.length > 0) {
            return res.status(400).json({ message: "This time slot is already booked." });
        }

        // ✅ Update reservation
        await pool.query(
            'UPDATE reservations SET chargerid = $1, starttime = $2, endtime = $3 WHERE reservationid = $4',
            [chargerid, start, end, id]
        );

        res.json({ message: "Booking updated successfully!" });
    } catch (err) {
        console.error("❌ Error updating booking:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});





