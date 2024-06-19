// Backend code

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.json({ message: "Hello World." });
});

const roomToUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId }) => {
    if (!roomToUsers.has(roomId)) {
      roomToUsers.set(roomId, new Set());
    }
    roomToUsers.get(roomId).add(socket.id);
    socket.join(roomId);

    io.to(roomId).emit("user-joined", {
      userId: socket.id,
      users: Array.from(roomToUsers.get(roomId)),
    });
  });

  socket.on("leave-room", ({ roomId }) => {
    if (roomToUsers.has(roomId)) {
      roomToUsers.get(roomId).delete(socket.id);
      io.to(roomId).emit("user-left", { userId: socket.id });
    }
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    roomToUsers.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        io.to(roomId).emit("user-left", { userId: socket.id });
      }
    });
  });

  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
