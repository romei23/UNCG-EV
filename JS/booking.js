document.addEventListener("DOMContentLoaded", () => {
    let bookings = [
        { date: "2025-02-28", time: "10:00 AM - 12:00 PM", location: "Lot 3 - UNCG" },
        { date: "2025-03-02", time: "2:00 PM - 4:00 PM", location: "Lot 7 - UNCG" },
    ];

    const bookingTableBody = document.querySelector("#bookingTable tbody");

    function renderBookings() {
        bookingTableBody.innerHTML = "";
        bookings.forEach((booking, index) => {
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${booking.date}</td>
                <td>${booking.time}</td>
                <td>${booking.location}</td>
                <td>
                    <button class="edit-btn" onclick="editBooking(${index})">Edit</button>
                    <button class="delete-btn" onclick="deleteBooking(${index})">Cancel</button>
                </td>
            `;
            bookingTableBody.appendChild(row);
        });
    }

    window.editBooking = (index) => {
        let newDate = prompt("Enter new date (YYYY-MM-DD):", bookings[index].date);
        let newTime = prompt("Enter new time slot:", bookings[index].time);
        let newLocation = prompt("Enter new location:", bookings[index].location);
        
        if (newDate && newTime && newLocation) {
            bookings[index] = { date: newDate, time: newTime, location: newLocation };
            renderBookings();
        }
    };

    window.deleteBooking = (index) => {
        if (confirm("Are you sure you want to cancel this booking?")) {
            bookings.splice(index, 1);
            renderBookings();
        }
    };

    renderBookings();
});
