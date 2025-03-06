const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function (event) {
    console.log('WebSocket is connected.');
});

socket.addEventListener('message', async function (event) {
    const messages = document.getElementById('messages');
    const message = document.createElement('div');
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
    const message = input.value;
    socket.send(message);
    input.value = '';
});