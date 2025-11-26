const { io } = require("socket.io-client");

// Thay bằng token thật của 2 user trong DB
const userTokens = {
  user1: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzY0MTYyMzE3LCJleHAiOjE3NjQ3NjcxMTd9.bwb2d15jZOwTWHDeaDaWe0bE6sPBqoFk0Wi9U8MPNlI",
  user2: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzY0MTYzNDYxLCJleHAiOjE3NjQ3NjgyNjF9.qbMM7tH2AZBWpq-6izSDzMjMaCHJJ8hAwahlTVM5HQ4"
};

const conversationId = 1; // conversation test

function createClient(userId, token) {
  const socket = io("http://localhost:3000", {
    auth: { token }
  });

  socket.on("connect", () => {
    console.log(`[${userId}] Connected with socket id: ${socket.id}`);

    // Join conversation
    socket.emit("join_conversation", conversationId);

    // Gửi tin nhắn test sau 2 giây
    setTimeout(() => {
      socket.emit("send_message", {
        conversationId,
        content: `Hello from ${userId}`,
        type: "text"
      });
    }, 2000);
  });

  socket.on("receive_message", (msg) => {
    console.log(`[${userId}] Received message:`, msg.content);
  });

  socket.on("message_notification", (data) => {
    console.log(`[${userId}] Notification:`, data.message.content);
  });

  socket.on("user_status", (data) => {
    console.log(`[${userId}] User status:`, data);
  });

  socket.on("disconnect", () => {
    console.log(`[${userId}] Disconnected`);
  });

  return socket;
}

// Tạo 2 client
const client1 = createClient("user1", userTokens.user1);
const client2 = createClient("user2", userTokens.user2);

// Tự động đóng sau 10s
setTimeout(() => {
  client1.disconnect();
  client2.disconnect();
  console.log("Test finished");
}, 10000);
