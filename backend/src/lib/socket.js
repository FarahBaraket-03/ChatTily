import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Used to store online users
const userSocketMap = {}; // {userId: socketId}

// Function to get the socket ID of a user
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle group chat messages
  socket.on("sendGroupMessage", (message) => {
    const { chatId } = message;
    if (chatId) {
      // Emit the message to all members of the group chat
      io.to(chatId).emit("newGroupMessage", message);
    }
  });

  // Handle joining a group chat room
  socket.on("joinGroupChat", (chatId) => {
    if (chatId) {
      socket.join(chatId); // Join the room for the group chat
      console.log(`User ${socket.id} joined group chat ${chatId}`);
    }
  });

  // Handle leaving a group chat room
  socket.on("leaveGroupChat", (chatId) => {
    if (chatId) {
      socket.leave(chatId); // Leave the room for the group chat
      console.log(`User ${socket.id} left group chat ${chatId}`);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("unfriend", ({ userId, friendId }) => {
    const friendSocketId = getReceiverSocketId(friendId);
    if (friendSocketId) {
      io.to(friendSocketId).emit("unfriended", {
        userId,
        friendId
      });
    }
  });
});

export { io, app, server };