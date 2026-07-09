import { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";
import { Server as NetServer } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function SocketHandler(req: NextApiRequest, res: any) {
  if (res.socket.server.io) {
    console.log("Socket.io is already active.");
    res.end();
    return;
  }

  console.log("Initializing Socket.io server...");
  const httpServer: NetServer = res.socket.server as any;
  const io = new IOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });
  
  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log(`[WebRTC Socket] Client connected: ${socket.id}`);

    socket.on("join-room", ({ roomId, userId, userName, isTeacher }) => {
      socket.join(roomId);
      console.log(`[WebRTC Socket] User ${userId} (${userName}, Teacher: ${isTeacher}) joined room ${roomId}`);
      
      // Save metadata directly to this socket instance for tracking
      (socket as any).userId = userId;
      (socket as any).userName = userName;

      // Query all sockets in this room to extract active users metadata
      const clients = io.sockets.adapter.rooms.get(roomId);
      const userList: any[] = [];
      if (clients) {
        for (const clientSocketId of clients) {
          const clientSocket = io.sockets.sockets.get(clientSocketId);
          if (clientSocket && clientSocket.id !== socket.id) {
            userList.push({
              socketId: clientSocket.id,
              userId: (clientSocket as any).userId || "unknown",
              userName: (clientSocket as any).userName || "Attendee",
            });
          }
        }
      }
      
      // Emit the roster of currently active users in the room to the joining client
      socket.emit("current-room-users", userList);

      // Notify other attendees in the room that a new peer has connected
      socket.to(roomId).emit("user-connected", { userId, userName, socketId: socket.id });
    });

    // 1. Zoom-like Waiting Room / Admission Queue events
    socket.on("request-entry", ({ roomId, userId, userName }) => {
      console.log(`[WebRTC Socket] User ${userId} (${userName}) requested entry to room ${roomId}`);
      // Relay entry request to hosts in the room
      socket.to(roomId).emit("entry-requested", { socketId: socket.id, userId, userName });
    });

    socket.on("admit-student", ({ roomId, targetSocketId, userId, userName }) => {
      console.log(`[WebRTC Socket] Host admitted student ${targetSocketId} in room ${roomId}`);
      // Inform the targeted student they are admitted
      io.to(targetSocketId).emit("entry-admitted", { roomId });
      // Notify the room that this user is now fully connected
      socket.to(roomId).emit("user-connected", { userId, userName, socketId: targetSocketId });
    });

    socket.on("deny-student", ({ roomId, targetSocketId }) => {
      console.log(`[WebRTC Socket] Host denied student ${targetSocketId} in room ${roomId}`);
      io.to(targetSocketId).emit("entry-denied");
    });

    // 2. Real-Time Chat Broadcast events
    socket.on("send-chat-message", ({ roomId, userId, userName, text, timestamp }) => {
      console.log(`[WebRTC Socket] Message in ${roomId} from ${userName}: ${text}`);
      io.to(roomId).emit("receive-chat-message", { userId, userName, text, timestamp });
    });

    socket.on("video-offer", ({ offer, roomId, toSocketId }) => {
      console.log(`[WebRTC Socket] Relaying offer from ${socket.id} to target ${toSocketId}`);
      socket.to(toSocketId || roomId).emit("video-offer", { offer, fromSocketId: socket.id });
    });

    socket.on("video-answer", ({ answer, roomId, toSocketId }) => {
      console.log(`[WebRTC Socket] Relaying answer from ${socket.id} to target ${toSocketId}`);
      socket.to(toSocketId || roomId).emit("video-answer", { answer, fromSocketId: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, roomId, toSocketId }) => {
      console.log(`[WebRTC Socket] Relaying ICE Candidate from ${socket.id} to target ${toSocketId}`);
      socket.to(toSocketId || roomId).emit("ice-candidate", { candidate, fromSocketId: socket.id });
    });

    socket.on("disconnect", () => {
      console.log(`[WebRTC Socket] Client disconnected: ${socket.id}`);
      io.emit("user-disconnected", socket.id);
    });
  });

  res.end();
}
