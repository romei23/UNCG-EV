const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function () {
    console.log('Connected to WebSocket server.');
});

socket.addEventListener('message', function (event) {
    const messages = document.getElementById('messages');
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', 'received'); // Received messages
    messageContainer.innerHTML = `${event.data}<br>`; // Add a break line after the message

    messages.appendChild(messageContainer);
});

document.getElementById('send-button').addEventListener('click', function () {
    const input = document.getElementById('message-input');
    const messageText = input.value;

    if (messageText.trim() === '') return; // Prevent sending empty messages

    // Send the message via WebSocket
    socket.send(messageText);

    // Clear the input field
    input.value = '';
});

// Clear Messages
document.getElementById('clear-button').addEventListener('click', function () {
    document.getElementById('messages').innerHTML = ''; // Clear all messages
});