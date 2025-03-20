const BASE_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
    fetchChargers();
    fetchBookings();
    document.getElementById("chargerSelect").addEventListener("change", fetchAvailableTimeSlots);
    document.getElementById("startTime").addEventListener("change", updateEndTimeOptions);
});

// ✅ Fetch chargers and populate dropdown
async function fetchChargers() {
    try {
        const response = await fetch(`${BASE_URL}/chargers`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const chargers = await response.json();

        const chargerSelect = document.getElementById('chargerSelect');
        chargerSelect.innerHTML = '<option value="">Select a Charging Station</option>';

        chargers.forEach(charger => {
            const option = document.createElement("option");
            option.value = charger.chargerid;
            option.textContent = charger.location;
            chargerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Error fetching chargers:', error);
    }
}

// ✅ Fetch available time slots based on selected charger and date
async function fetchAvailableTimeSlots() {
    const chargerid = document.getElementById("chargerSelect").value;
    const selectedDate = document.getElementById("bookingDate").value;

    if (!chargerid || !selectedDate) return;

    try {
        const reservationsResponse = await fetch(`${BASE_URL}/reservations`);
        if (!reservationsResponse.ok) throw new Error(`HTTP error! Status: ${reservationsResponse.status}`);
        const reservations = await reservationsResponse.json();

        generateTimeSlots(reservations, chargerid, selectedDate);
    } catch (error) {
        console.error('❌ Error fetching reservations:', error);
    }
}

// ✅ Generate available time slots dynamically, removing booked slots
function generateTimeSlots(reservations, chargerid, selectedDate) {
    const startSelect = document.getElementById("startTime");
    const endSelect = document.getElementById("endTime");

    startSelect.innerHTML = '<option value="">Select Start Time</option>';
    endSelect.innerHTML = '<option value="">Select End Time</option>';
    startSelect.disabled = false;
    endSelect.disabled = true;

    if (!chargerid || !selectedDate) return;

    // ✅ Collect ALL booked time ranges for this charger & date
    let bookedIntervals = [];

    reservations.forEach(res => {
        if (res.chargerid == chargerid && res.starttime.startsWith(selectedDate)) {
            let start = new Date(res.starttime);
            let end = new Date(res.endtime);

            // ✅ Store ALL 15-minute slots inside this range
            while (start < end) {
                bookedIntervals.push(start.toISOString()); // Store in ISO format for comparison
                start.setMinutes(start.getMinutes() + 15);
            }
        }
    });

    console.log("🚧 Booked Intervals:", bookedIntervals); // Debugging Output

    let availableTimes = [];

    for (let hour = 0; hour < 24; hour++) {
        for (let minutes = 0; minutes < 60; minutes += 15) {
            let amPm = hour < 12 ? "AM" : "PM";
            let displayHour = hour % 12 || 12;
            let timeString = `${displayHour}:${minutes.toString().padStart(2, '0')} ${amPm}`;
            let value = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

            const currentTime = new Date(`${selectedDate}T${value}`);
            currentTime.setHours(currentTime.getHours() + 4); // Adjust for server timezone

            let currentTimeISO = currentTime.toISOString(); // Convert to ISO format for comparison

            // ✅ Check if this time is in the bookedIntervals array
            const isBooked = bookedIntervals.includes(currentTimeISO);

            let startOption = document.createElement("option");
            startOption.value = value;
            startOption.textContent = timeString;

            if (isBooked) {
                startOption.style.color = "red"; // 🔴 Mark booked slots in red
                startOption.disabled = true;     // ❌ Disable booked slots
            } else {
                availableTimes.push({ value, timeString });
            }

            startSelect.appendChild(startOption);
        }
    }

    startSelect.dataset.availableTimes = JSON.stringify(availableTimes);
}



// ✅ Populate end time dropdown based on selected start time
function updateEndTimeOptions() {
    const startSelect = document.getElementById("startTime");
    const endSelect = document.getElementById("endTime");

    endSelect.innerHTML = '<option value="">Select End Time</option>';
    endSelect.disabled = true;

    const selectedStartTime = startSelect.value;
    if (!selectedStartTime) return;

    const availableTimes = JSON.parse(startSelect.dataset.availableTimes || "[]");

    let canAddTimes = false;
    availableTimes.forEach(timeSlot => {
        if (timeSlot.value === selectedStartTime) {
            canAddTimes = true;
        }
        if (canAddTimes) {
            let endOption = document.createElement("option");
            endOption.value = timeSlot.value;
            endOption.textContent = timeSlot.timeString;
            endSelect.appendChild(endOption);
        }
    });

    endSelect.disabled = false;
}


// ✅ Submit Booking with Start & End Time
async function submitBooking() {
    const chargerid = document.getElementById('chargerSelect').value;
    const date = document.getElementById('bookingDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (!chargerid || !date || !startTime || !endTime) {
        alert("⚠️ Please select all booking details.");
        return;
    }

    if (endTime <= startTime) {
        alert("⚠️ End time must be later than start time.");
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

        if (response.status === 400) {
            alert(result.message);
        } else {
            alert("✅ Booking confirmed!");
            fetchBookings();
            fetchAvailableTimeSlots();
        }
    } catch (error) {
        console.error('Error booking charger:', error);
        alert("⚠️ Booking could not be completed. Please try again.");
    }
}

// ✅ Convert time to 12-hour format (Adjust UTC to EST)
function formatTimeTo12Hour(utcDateTime) {
    const utcDate = new Date(utcDateTime);
    utcDate.setHours(utcDate.getHours() - 4); // ✅ Adjust UTC to EST (-4 hours)

    let hour = utcDate.getHours();
    const minute = utcDate.getMinutes().toString().padStart(2, "0");
    const amPm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${minute} ${amPm}`;
}

// ✅ Fetch and display bookings
// ✅ Fetch and display bookings
async function fetchBookings() {
    try {
        const response = await fetch(`${BASE_URL}/reservations`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const bookings = await response.json();
        const tableBody = document.querySelector("#bookingTable tbody");
        tableBody.innerHTML = '';

        if (bookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No bookings found.</td></tr>`;
            return;
        }

        bookings.forEach(booking => {
            const startTime = formatTimeTo12Hour(booking.starttime);
            const endTime = formatTimeTo12Hour(booking.endtime);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${formatDateToLocal(booking.starttime)}</td>
                <td>${startTime} - ${endTime}</td>
                <td>${booking.location}</td>
                <td>
                    <button class="edit-btn" onclick="editBooking(${booking.reservationid}, ${booking.chargerid}, '${booking.starttime}', '${booking.endtime}', '${booking.starttime.split('T')[0]}')">Edit</button>
                    <button class="delete-btn" onclick="cancelBooking(${booking.reservationid})">Cancel</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        function formatDateToLocal(utcDateTime) {
            const utcDate = new Date(utcDateTime);
            const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
            return localDate.toISOString().split("T")[0]; // Extract YYYY-MM-DD
        }


    } catch (error) {
        console.error('Error fetching bookings:', error);
    }
}


// ✅ Open edit modal and prefill booking details
function editBooking(reservationId, chargerId, currentStartTime, currentEndTime, currentDate) {
    document.getElementById("editModal").style.display = "block";

    // ✅ Keep the same station (disable dropdown)
    const chargerSelect = document.getElementById("editChargerSelect");
    chargerSelect.innerHTML = `<option value="${chargerId}" selected>Current Station</option>`;
    chargerSelect.disabled = true; // Prevent changing charger

    // ✅ Set Date
    document.getElementById("editBookingDate").value = currentDate;

    // ✅ Convert times and populate dropdowns
    document.getElementById("editStartTime").innerHTML = generateTimeOptions(formatTimeForDropdown(currentStartTime));
    document.getElementById("editEndTime").innerHTML = generateTimeOptions(formatTimeForDropdown(currentEndTime));

    // ✅ Set Update Booking Button Action
    document.getElementById("editBookingBtn").onclick = function () {
        submitEditBooking(reservationId, chargerId);
    };
}


// ✅ Convert stored UTC time to dropdown format
// ✅ Generate dropdown options for time fields
function generateTimeOptions(selectedTime) {
    let options = `<option value="">Select Time</option>`;

    for (let hour = 0; hour < 24; hour++) {
        for (let minutes = 0; minutes < 60; minutes += 15) {
            let amPm = hour < 12 ? "AM" : "PM";
            let displayHour = hour % 12 || 12;
            let timeString = `${displayHour}:${minutes.toString().padStart(2, '0')} ${amPm}`;
            let value = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

            let selected = selectedTime === timeString ? "selected" : "";
            options += `<option value="${value}" ${selected}>${timeString}</option>`;
        }
    }

    return options;
}


// ✅ Convert stored UTC time to dropdown format
function formatTimeForDropdown(utcDateTime) {
    const utcDate = new Date(utcDateTime);
    utcDate.setHours(utcDate.getHours() - 4); // Adjust UTC to EST (-4 hours)

    let hour = utcDate.getHours();
    const minute = utcDate.getMinutes().toString().padStart(2, "0");
    const amPm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${minute} ${amPm}`;
}
// ✅ Cancel a booking
async function cancelBooking(reservationId) {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
        const response = await fetch(`${BASE_URL}/reservations/${reservationId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ Booking successfully canceled!");
            fetchBookings();  // Refresh bookings after deletion
            fetchAvailableTimeSlots(); // Update available slots
        } else {
            alert(`⚠️ Deletion Failed: ${result.message}`);
        }
    } catch (error) {
        console.error('❌ Error canceling booking:', error);
        alert("⚠️ Could not delete booking. Please try again.");
    }
}


// ✅ Submit edited booking details
// ✅ Submit edited booking details
async function submitEditBooking(reservationId) {
    const chargerid = document.getElementById('editChargerSelect').value;
    const date = document.getElementById('editBookingDate').value;
    const startTime = document.getElementById('editStartTime').value;
    const endTime = document.getElementById('editEndTime').value;

    if (!chargerid || !date || !startTime || !endTime) {
        alert("⚠️ Please select all fields.");
        return;
    }

    if (endTime <= startTime) {
        alert("⚠️ End time must be later than start time.");
        return;
    }

    const starttime = `${date}T${startTime}`;
    const endtime = `${date}T${endTime}`;

    try {
        // ✅ Fetch existing reservations to check for conflicts
        const reservationsResponse = await fetch(`${BASE_URL}/reservations`);
        const reservations = await reservationsResponse.json();

        const hasConflict = reservations.some(reservation => {
            if (reservation.reservationid == reservationId) return false; // Ignore current reservation
            return (
                reservation.chargerid == chargerid &&
                date === reservation.starttime.split('T')[0] &&
                !(endtime <= reservation.starttime || starttime >= reservation.endtime)
            );
        });

        if (hasConflict) {
            alert("⚠️ This charger is already booked during the selected time.");
            return;
        }

        // ✅ Proceed with updating the booking
        const response = await fetch(`${BASE_URL}/reservations/${reservationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chargerid, starttime, endtime })
        });

        const result = await response.json();

        if (response.ok) {
            alert("✅ Booking updated successfully!");
            fetchBookings();
            closeEditModal();
        } else {
            alert(`⚠️ Update Failed: ${result.message}`);
        }
    } catch (error) {
        console.error('❌ Error updating booking:', error);
        alert("⚠️ Could not update booking. Please try again.");
    }
}


function closeEditModal() {
    console.log("🛑 Closing edit modal...");
    document.getElementById("editModal").style.display = "none";

    // Clear the form fields to avoid seeing old data
    document.getElementById("editChargerSelect").value = "";
    document.getElementById("editBookingDate").value = "";
    document.getElementById("editStartTime").value = "";
    document.getElementById("editEndTime").value = "";
}
async function populateEditTimeSlots(chargerid, selectedDate, reservationId) {
    const startSelect = document.getElementById("editStartTime");
    const endSelect = document.getElementById("editEndTime");

    startSelect.innerHTML = '<option value="">Select Start Time</option>';
    endSelect.innerHTML = '<option value="">Select End Time</option>';
    startSelect.disabled = false;
    endSelect.disabled = true;

    try {
        // ✅ Fetch all reservations
        const reservationsResponse = await fetch(`${BASE_URL}/reservations`);
        const reservations = await reservationsResponse.json();

        // ✅ Get booked times excluding the current reservation
        const bookedTimes = reservations
            .filter(res => res.chargerid == chargerid && res.starttime.includes(selectedDate) && res.reservationid != reservationId)
            .map(res => ({
                start: new Date(res.starttime),
                end: new Date(res.endtime),
            }));

        let availableTimes = [];

        for (let hour = 0; hour < 24; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 15) {
                let amPm = hour < 12 ? "AM" : "PM";
                let displayHour = hour % 12 || 12;
                let timeString = `${displayHour}:${minutes.toString().padStart(2, '0')} ${amPm}`;
                let value = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

                const currentTime = new Date(`${selectedDate}T${value}`);

                // ✅ Check if this time is booked
                const isBooked = bookedTimes.some(reservation =>
                    currentTime >= reservation.start && currentTime < reservation.end
                );

                let startOption = document.createElement("option");
                startOption.value = value;
                startOption.textContent = timeString;

                if (isBooked) {
                    startOption.disabled = true; // Disable booked times
                    startOption.style.color = "red"; // Highlight in red
                } else {
                    availableTimes.push({ value, timeString });
                }

                startSelect.appendChild(startOption);
            }
        }

        startSelect.dataset.availableTimes = JSON.stringify(availableTimes);
    } catch (error) {
        console.error('❌ Error fetching reservations:', error);
    }
}







