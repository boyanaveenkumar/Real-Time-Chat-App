const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let users = {}; // Store connected users and their rooms

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for user login
    socket.on('login', (username) => {
        users[socket.id] = { username, room: null };
        io.emit('user joined', `${username} joined the chat`);
        io.emit('update users', Object.values(users).map(user => user.username)); // Send updated user list
    });

    // Listen for room join events
    socket.on('join room', (room) => {
        if (users[socket.id]) {
            const { username } = users[socket.id];

            // Leave the previous room if any
            if (users[socket.id].room) {
                socket.leave(users[socket.id].room);
                io.to(users[socket.id].room).emit('room message', {
                    username: 'System',
                    message: `${username} left the room`,
                    timestamp: new Date().toLocaleTimeString(),
                });
            }

            // Join the new room
            socket.join(room);
            users[socket.id].room = room;

            // Notify the room
            io.to(room).emit('room message', {
                username: 'System',
                message: `${username} joined the room`,
                timestamp: new Date().toLocaleTimeString(),
            });

            // Send updated user list to the room
            const roomUsers = Object.values(users)
                .filter(user => user.room === room)
                .map(user => user.username);
            io.to(room).emit('update users', roomUsers);
        }
    });

    // Listen for chat messages
    socket.on('chat message', (msg) => {
        const { username, room } = users[socket.id];
        if (username && room) {
            const messageData = {
                username,
                message: msg,
                timestamp: new Date().toLocaleTimeString(),
            };
            io.to(room).emit('chat message', messageData); // Broadcast the message to the room
        }
    });

    // Listen for typing events
    socket.on('typing', () => {
        const { username, room } = users[socket.id];
        if (username && room) {
            socket.to(room).emit('typing', `${username} is typing...`);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        const { username, room } = users[socket.id];
        if (username) {
            io.emit('user left', `${username} left the chat`);
            if (room) {
                io.to(room).emit('room message', {
                    username: 'System',
                    message: `${username} left the room`,
                    timestamp: new Date().toLocaleTimeString(),
                });

                // Update user list for the room
                const roomUsers = Object.values(users)
                    .filter(user => user.room === room)
                    .map(user => user.username);
                io.to(room).emit('update users', roomUsers);
            }
            delete users[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});