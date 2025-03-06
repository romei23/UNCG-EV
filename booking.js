const BASE_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
    fetchChargers();
    fetchBookings();
    generateTimeSlots();
});

// Fetch chargers and populate dropdown
async function fetchChargers() {
    try {
        const response = await fetch(`${BASE_URL}/chargers`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const chargers = await response.json();

        const chargerSelect = document.getElementById('chargerSelect');
        chargerSelect.innerHTML = '';

        chargers.forEach(charger => {
            const option = document.createElement('option');
            option.value = charger.chargerid;
            option.textContent = `${charger.location} - ${charger.status}`;
            option.disabled = charger.status === 'In Use';
            chargerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching chargers:', error);
    }
}

//Generate time slots (Every 15 minutes, 24 hours available)
function generateTimeSlots() {
    const startSelect = document.getElementById("startTime");
    const endSelect = document.getElementById("endTime");
    startSelect.innerHTML = '';
    endSelect.innerHTML = '';

    for (let hour = 0; hour < 24; hour++) {
        for (let minutes = 0; minutes < 60; minutes += 15) {
            let amPm = hour < 12 ? "AM" : "PM";
            let displayHour = hour % 12 || 12;
            let timeString = `${displayHour}:${minutes.toString().padStart(2, '0')} ${amPm}`;

            let value = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

            let startOption = document.createElement("option");
            startOption.value = value;
            startOption.textContent = timeString;
            startSelect.appendChild(startOption);

            let endOption = document.createElement("option");
            endOption.value = value;
            endOption.textContent = timeString;
            endSelect.appendChild(endOption);
        }
    }
}
// Cancel a booking
async function cancelBooking(reservationId) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
        const response = await fetch(`${BASE_URL}/reservations/${reservationId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        alert("Booking canceled successfully!");
        fetchChargers(); // Refresh charger availability
        fetchBookings(); // Refresh bookings table

    } catch (error) {
        console.error('Error canceling booking:', error);
        alert("Failed to cancel booking.");
    }
}

// Submit Booking with Start & End Time
async function submitBooking() {
    const chargerid = document.getElementById('chargerSelect').value;
    const date = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (!chargerid || !date || !startTime || !endTime) {
        alert("Please select a charger, date, start time, and end time.");
        return;
    }

    if (endTime <= startTime) {
        alert("End time must be later than start time.");
        return;
    }

    const starttime = `${date}T${startTime}`;
    const endtime = `${date}T${endTime}`;

    try {
        const response = await fetch(`${BASE_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chargerid, starttime, endtime })
        });

        const result = await response.json();
        alert(result.message);
        fetchChargers();
        fetchBookings();
    } catch (error) {
        console.error('Error booking charger:', error);
    }
}

// Convert time to 12-hour format for display
function formatTimeTo12Hour(utcDateTime) {
    const utcDate = new Date(utcDateTime);

    // Manually subtract 5 hours from UTC time
    utcDate.setHours(utcDate.getHours() - 5);

    let hour = utcDate.getHours();
    const minute = utcDate.getMinutes().toString().padStart(2, "0");
    const amPm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // Convert 24-hour format to 12-hour format

    return `${hour}:${minute} ${amPm}`;
}


// ✅ Fetch and display bookings
async function fetchBookings() {
    try {
        const response = await fetch(`${BASE_URL}/reservations`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const bookings = await response.json();
        console.log("Received Bookings Data:", bookings); // Debugging

        const tableBody = document.querySelector("#bookingTable tbody");
        tableBody.innerHTML = '';

        bookings.forEach(booking => {
            const startTime = formatTimeTo12Hour(booking.starttime);
            const endTime = formatTimeTo12Hour(booking.endtime);

            // ✅ Use "location" field (This was working before)
            const chargerName = booking.location || "Unknown Charger";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${booking.starttime.split('T')[0]}</td>
                <td>${startTime} - ${endTime}</td>
                <td>${chargerName}</td>
                <td><button class="delete-btn" onclick="cancelBooking(${booking.reservationid})">Cancel</button></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
    }
}
