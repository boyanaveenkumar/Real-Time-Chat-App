const socket = io();

const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const usernameInput = document.getElementById('username');
const loginBtn = document.getElementById('login-btn');
const roomInput = document.getElementById('room');
const joinRoomBtn = document.getElementById('join-room-btn');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send-btn');
const typingStatus = document.getElementById('typing-status');
const userList = document.getElementById('user-list');

let username = '';

// Login handler
loginBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (username) {
        socket.emit('login', username);
        loginSection.style.display = 'none';
        chatSection.style.display = 'block';
    }
});

// Join room handler
joinRoomBtn.addEventListener('click', () => {
    const room = roomInput.value.trim();
    if (room) {
        socket.emit('join room', room);
    }
});

// Send message handler (button click)
sendBtn.addEventListener('click', sendMessage);

// Send message handler (Enter key)
messageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevents new line in input
        sendMessage();
    }
});

// Function to send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chat message', message);
        messageInput.value = ''; // Clear input after sending
    }
}


// Typing indicator
messageInput.addEventListener('input', () => {
    socket.emit('typing');
});

// Listen for messages
socket.on('chat message', (msg) => {
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${msg.username}</strong>: ${msg.message} <em>(${msg.timestamp})</em>`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
});

// Listen for typing events
socket.on('typing', (status) => {
    typingStatus.textContent = status;
    setTimeout(() => {
        typingStatus.textContent = '';
    }, 3000);
});

// Listen for user list updates
socket.on('update users', (users) => {
    userList.innerHTML = users.map(user => `<li>${user}</li>`).join('');
});