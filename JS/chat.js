const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function (event) {
    console.log('WebSocket is connected.');
});

socket.addEventListener('message', async function (event) {
    const messages = document.getElementById('messages');
    const message = document.createElement('div');
    message.classList.add('message', 'received'); // Received messages
    if (event.data instanceof Blob) {
        const text = await event.data.text();
        message.textContent = text;
    } else {
        message.textContent = event.data;
    }

    messages.appendChild(message);
});

document.getElementById('send-button').addEventListener('click', function () {
    const input = document.getElementById('message-input');
    const messageText = input.value;

    if (messageText.trim() === '') return; // Prevent sending empty messages

    socket.send(messageText); // Send message via WebSocket
    input.value = ''; // Clear input
});

// Clear Messages
document.getElementById('clear-button').addEventListener('click', function () {
    document.getElementById('messages').innerHTML = ''; // Clear all messages
});