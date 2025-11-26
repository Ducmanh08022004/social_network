require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');

const { sequelize, Conversation, ConversationMember, Message, MessageReceipt } = require('./models');

// ROUTES
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const friendshipRoutes = require('./routes/friendships');
const postRoutes = require('./routes/posts');
const likeRoutes = require('./routes/likes');
const commentRoutes = require('./routes/comments');
const notificationRoutes = require('./routes/notifications');
const chatRoutes = require('./routes/chat');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => res.send('Social API running'));
console.log("Cloudinary:", process.env.CLOUDINARY_CLOUD_NAME);

// ---------------------------------------
//  TẠO HTTP SERVER + SOCKET.IO SERVER
// ---------------------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// Map userId → Set(socketId)
const onlineUsers = new Map();

function addUser(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeUser(userId, socketId) {
  if (!onlineUsers.has(userId)) return;
  onlineUsers.get(userId).delete(socketId);
  if (onlineUsers.get(userId).size === 0) onlineUsers.delete(userId);
}

// ---------------------------------------
//  Middleware xác thực token cho socket
// ---------------------------------------
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing token'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;

    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

// ---------------------------------------
//  WebSocket Events
// ---------------------------------------
io.on('connection', (socket) => {
  const userId = socket.userId;
  addUser(userId, socket.id);

  console.log(`User ${userId} connected. Total: ${onlineUsers.size}`);

  // broadcast online status
  io.emit('user_status', { userId, status: 'online' });

  // Join room
  socket.on("join_conversation", (conversationId) => {
    socket.join("conv_" + conversationId);
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave("conv_" + conversationId);
  });

  // Typing
  socket.on("typing", ({ conversationId, isTyping }) => {
    socket.to("conv_" + conversationId).emit("typing", {
      userId,
      conversationId,
      isTyping,
    });
  });

  // Gửi tin nhắn
  socket.on("send_message", async ({ conversationId, content, type }) => {
    try {
      const message = await Message.create({
        conversation_id: conversationId,
        sender_id: userId,
        content,
        type: type || "text",
        created_at: new Date(),
      });

      // Gửi tới phòng
      io.to("conv_" + conversationId).emit("receive_message", message);

      // Gửi "delivered" receipts
      const members = await ConversationMember.findAll({ where: { conversation_id: conversationId } });

      const receipts = members
        .filter(m => m.user_id !== userId)
        .map(m => ({
          message_id: message.id,
          user_id: m.user_id,
          status: "delivered",
          updated_at: new Date()
        }));

      if (receipts.length) {
        await MessageReceipt.bulkCreate(receipts);
      }

      // thông báo tới từng user
      for (const m of members) {
        if (m.user_id === userId) continue;
        if (!onlineUsers.has(m.user_id)) continue;

        for (const sId of onlineUsers.get(m.user_id)) {
          io.to(sId).emit("message_notification", {
            conversationId,
            message
          });
        }
      }

    } catch (err) {
      console.log("Error sending message:", err);
      socket.emit("error_message", { message: "Cannot send message" });
    }
  });

  // Seen messages
  socket.on("message_seen", async ({ conversationId, messageIds }) => {
    try {
      for (const id of messageIds) {
        await MessageReceipt.upsert({
          message_id: id,
          user_id: userId,
          status: "read",
          updated_at: new Date(),
        });
      }

      io.to("conv_" + conversationId).emit("message_seen", {
        userId,
        conversationId,
        messageIds
      });
    } catch (err) {
      console.log("Seen error:", err);
    }
  });

  socket.on('disconnect', () => {
    removeUser(userId, socket.id);

    if (!onlineUsers.has(userId)) {
      io.emit('user_status', { userId, status: 'offline' });
    }

    console.log(`User ${userId} disconnected.`);
  });
});

// ---------------------------------------
//  Khởi động server
// ---------------------------------------
const PORT = process.env.PORT || 3000;
(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');
    await sequelize.sync({ alter: true });

    server.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error('Unable to start server:', err);
  }
})();
