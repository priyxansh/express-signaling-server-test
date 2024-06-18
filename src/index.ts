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

const roomToBroadcaster = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", (data: { roomId: string }) => {
    socket.join(data.roomId);

    const isBroadcaster = roomToBroadcaster.get(data.roomId) === undefined;

    if (isBroadcaster) {
      roomToBroadcaster.set(data.roomId, socket.id);
    }

    io.to(data.roomId).emit("user-joined", {
      userId: socket.id,
      isBroadcaster,
      broadcasterId: roomToBroadcaster.get(data.roomId),
    });
  });

  socket.on(
    "offer",
    (data: { to: string; offer: RTCSessionDescriptionInit }) => {
      io.to(data.to).emit("offer", { offer: data.offer, from: socket.id });
    }
  );

  socket.on(
    "answer",
    (data: { to: string; answer: RTCSessionDescriptionInit }) => {
      io.to(data.to).emit("answer", { answer: data.answer, from: socket.id });
    }
  );

  socket.on(
    "negotiation-needed",
    (data: { to: string; offer: RTCSessionDescriptionInit }) => {
      io.to(data.to).emit("negotiation-needed", {
        offer: data.offer,
        from: socket.id,
      });
    }
  );

  socket.on(
    "negotiation-done",
    (data: { to: string; answer: RTCSessionDescriptionInit }) => {
      io.to(data.to).emit("negotiation-done", {
        answer: data.answer,
        from: socket.id,
      });
    }
  );

  socket.on(
    "ice-candidate",
    (data: { to: string; candidate: RTCIceCandidate }) => {
      io.to(data.to).emit("ice-candidate", {
        candidate: data.candidate,
        from: socket.id,
      });
    }
  );
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
