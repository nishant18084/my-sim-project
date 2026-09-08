const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

mongoose.connect('mongodb://127.0.0.1:27017/whatsapp_db')
  .then(() => console.log('DB Connected'))
  .catch(err => console.log('DB Connection Error:', err));

const User = mongoose.model('User', { username: { type: String, unique: true } });
const Message = mongoose.model('Message', { sender: String, receiver: String, text: String, time: String });

// Login API
app.post('/api/login', async (req, res) => {
  const { username } = req.body;
  let user = await User.findOne({ username });
  if (!user) user = await User.create({ username });
  res.json(user);
});

// All Users API
app.get('/api/users/:me', async (req, res) => {
  const users = await User.find({ username: { $ne: req.params.me } });
  res.json(users);
});

// Messages API
app.get('/api/messages/:u1/:u2', async (req, res) => {
  const msgs = await Message.find({
    $or: [
      { sender: req.params.u1, receiver: req.params.u2 },
      { sender: req.params.u2, receiver: req.params.u1 }
    ]
  });
  res.json(msgs);
});

// Socket.io
const server = http.createServer(app);
const io = new Server(server);
const onlineUsers = new Map();

io.on('connection', (socket) => {
  socket.on('join', (username) => {
    onlineUsers.set(username, socket.id);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });

  socket.on('send_msg', async (data) => {
    const saved = await Message.create(data);
    const targetSocket = onlineUsers.get(data.receiver);
    if (targetSocket) io.to(targetSocket).emit('recv_msg', saved);
    socket.emit('recv_msg', saved);
  });

  socket.on('disconnect', () => {
    for (const [u, id] of onlineUsers.entries()) {
      if (id === socket.id) onlineUsers.delete(u);
    }
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
