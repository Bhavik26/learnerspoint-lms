"use client";

import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

interface LiveStreamContainerProps {
  roomId: string;
  userId: string;
  userName: string;
  isTeacher: boolean;
  onStreamEnd?: () => void;
}

interface WaitingStudent {
  socketId: string;
  userId: string;
  userName: string;
}

interface ChatMessage {
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export default function LiveStreamContainer({
  roomId,
  userId,
  userName,
  isTeacher,
  onStreamEnd,
}: LiveStreamContainerProps) {
  const [socketActive, setSocketActive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Initializing Room...");
  
  // Waiting Room states
  const [isAdmitted, setIsAdmitted] = useState(isTeacher); // Teachers bypass waiting room
  const [waitingQueue, setWaitingQueue] = useState<WaitingStudent[]>([]);
  const [activeStudents, setActiveStudents] = useState<WaitingStudent[]>([]);
  
  // Screen Sharing states
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Chat Panel states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [socketId: string]: RTCPeerConnection }>({});
  
  // HTML5 Video Elements (hidden, used to draw onto canvas)
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Canvas elements for smooth WebView rendering
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const localCanvasAnimRef = useRef<number | null>(null);
  const remoteCanvasAnimRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Check runtime permissions and activate media capture
    initMediaStream();

    // 2. Setup Socket.io client connection
    initSocketConnection();

    return () => {
      cleanupStreamsAndConnections();
    };
  }, [roomId]);

  useEffect(() => {
    // Auto-scroll chat panel to bottom
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const initMediaStream = async () => {
    try {
      setConnectionStatus("Requesting Camera & Mic permissions...");
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: true,
      });

      localStreamRef.current = stream;

      // Bind to hidden video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch((err) => console.log("Local video playback wait:", err));
      }

      // Start rendering loop onto the local canvas
      startCanvasRender(localVideoRef, localCanvasRef, localCanvasAnimRef);
      setConnectionStatus("Media capture active. Authenticating connection...");
    } catch (err) {
      console.error("Failed to fetch user media device stream:", err);
      setConnectionStatus("Hardware Access Error: Check Camera/Microphone Permissions.");
    }
  };

  const initSocketConnection = () => {
    const socket = io({
      path: "/api/socket",
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketActive(true);
      console.log("Connected to signaling server.");
      
      if (isTeacher) {
        // Teachers join room immediately and start hosting
        socket.emit("join-room", { roomId, userId, userName, isTeacher: true });
        setConnectionStatus("Broadcasting stream to lecture hall...");
      } else {
        // Students request entry first
        setConnectionStatus("Waiting in waiting room for host permission...");
        socket.emit("request-entry", { roomId, userId, userName });
      }
    });

    // --- Waiting Room Signaling Observers ---
    socket.on("entry-requested", ({ socketId, userId: reqUserId, userName: reqUserName }) => {
      if (isTeacher) {
        setWaitingQueue((prev) => {
          if (prev.some((s) => s.socketId === socketId)) return prev;
          return [...prev, { socketId, userId: reqUserId, userName: reqUserName }];
        });
      }
    });

    socket.on("entry-admitted", ({ roomId: targetRoomId }) => {
      console.log("Teacher admitted connection. Accessing live stream room...");
      setIsAdmitted(true);
      setConnectionStatus("Admitted. Connecting to live broadcast...");
      socket.emit("join-room", { roomId: targetRoomId, userId, userName, isTeacher: false });
    });

    socket.on("entry-denied", () => {
      setConnectionStatus("Access denied by host.");
      cleanupStreamsAndConnections();
    });

    socket.on("current-room-users", (userList: WaitingStudent[]) => {
      console.log("Loaded current room users list:", userList);
      setActiveStudents(userList);
    });

    // --- Live Chat Observers ---
    socket.on("receive-chat-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    // --- WebRTC Core Handshakes ---
    socket.on("user-connected", async ({ userId: connectedUserId, userName: connectedName, socketId }) => {
      console.log(`User connected: ${connectedName} (${socketId})`);
      setActiveStudents((prev) => {
        if (prev.some((s) => s.socketId === socketId)) return prev;
        return [...prev, { socketId, userId: connectedUserId, userName: connectedName }];
      });
      if (isTeacher) {
        await createPeerConnection(socketId, connectedName);
      }
    });

    socket.on("video-offer", async ({ offer, fromSocketId }) => {
      console.log(`Received video offer from ${fromSocketId}`);
      if (!isTeacher) {
        const pc = await createPeerConnection(fromSocketId, "Teacher/Host");
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("video-answer", { answer, roomId, toSocketId: fromSocketId });
      }
    });

    socket.on("video-answer", async ({ answer, fromSocketId }) => {
      console.log(`Received video answer from ${fromSocketId}`);
      const pc = peerConnectionsRef.current[fromSocketId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async ({ candidate, fromSocketId }) => {
      const pc = peerConnectionsRef.current[fromSocketId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("user-disconnected", (socketId) => {
      if (peerConnectionsRef.current[socketId]) {
        peerConnectionsRef.current[socketId].close();
        delete peerConnectionsRef.current[socketId];
      }
      setWaitingQueue((prev) => prev.filter((s) => s.socketId !== socketId));
      setActiveStudents((prev) => prev.filter((s) => s.socketId !== socketId));
    });
  };

  const createPeerConnection = async (targetSocketId: string, targetName: string) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    peerConnectionsRef.current[targetSocketId] = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          candidate: event.candidate,
          roomId,
          toSocketId: targetSocketId,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((err) => console.log("Remote playback waiting:", err));
      }
      startCanvasRender(remoteVideoRef, remoteCanvasRef, remoteCanvasAnimRef);
      setConnectionStatus("Connected. Lecture active.");
    };

    if (isTeacher) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (socketRef.current) {
        socketRef.current.emit("video-offer", { offer, roomId, toSocketId: targetSocketId });
      }
    }

    return pc;
  };

  // Canvas context drawer to support hardware-accelerated WebView playback
  const startCanvasRender = (
    videoRef: React.MutableRefObject<HTMLVideoElement | null>,
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
    animRef: React.MutableRefObject<number | null>
  ) => {
    const draw = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    
    if (animRef.current) cancelAnimationFrame(animRef.current);
    draw();
  };

  // --- Zoom waiting room moderator actions ---
  const handleAdmit = (student: WaitingStudent) => {
    if (socketRef.current) {
      socketRef.current.emit("admit-student", {
        roomId,
        targetSocketId: student.socketId,
        userId: student.userId,
        userName: student.userName,
      });
      setWaitingQueue((prev) => prev.filter((s) => s.socketId !== student.socketId));
    }
  };

  const handleDeny = (student: WaitingStudent) => {
    if (socketRef.current) {
      socketRef.current.emit("deny-student", {
        roomId,
        targetSocketId: student.socketId,
      });
      setWaitingQueue((prev) => prev.filter((s) => s.socketId !== student.socketId));
    }
  };

  // --- Screen Sharing module ---
  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        
        const videoTrack = stream.getVideoTracks()[0];
        
        // Swap track in local stream and peer connections
        if (localStreamRef.current) {
          const oldTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldTrack) localStreamRef.current.removeTrack(oldTrack);
          localStreamRef.current.addTrack(videoTrack);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
        }

        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setIsSharingScreen(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Screen sharing activation error:", err);
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    try {
      // Re-acquire camera stream
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const camTrack = camStream.getVideoTracks()[0];

      if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(camTrack);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }

      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });

      setIsSharingScreen(false);
    } catch (err) {
      console.error("Restoring camera track error:", err);
    }
  };

  // --- Sidebar Chat messaging triggers ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;

    socketRef.current.emit("send-chat-message", {
      roomId,
      userId,
      userName,
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setChatInput("");
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const cleanupStreamsAndConnections = () => {
    if (localCanvasAnimRef.current) cancelAnimationFrame(localCanvasAnimRef.current);
    if (remoteCanvasAnimRef.current) cancelAnimationFrame(remoteCanvasAnimRef.current);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};

    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const endStream = async () => {
    // Automated sync recording database update hook
    if (isTeacher) {
      try {
        await fetch("/api/live/webhook-archive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            isStreaming: false,
            recordingUrl: `/recordings/live-${roomId}-${Date.now()}.mp4`,
          }),
        });
      } catch (err) {
        console.warn("Recording archiver offline. Working with local sandbox defaults.", err);
      }
    }
    
    cleanupStreamsAndConnections();
    if (onStreamEnd) onStreamEnd();
  };

  // Attendee waiting screen overlay
  if (!isAdmitted) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-6">
        <div className="w-16 h-16 border-4 border-[#3DBFF2] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h3 className="font-extrabold text-lg text-white">Class Waiting Room</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          You are currently in the admission queue. The instructor has been notified of your request to join. Please wait.
        </p>
        <div className="text-xs text-slate-500 font-mono bg-slate-950 p-2.5 rounded border border-slate-850 truncate">
          Status: {connectionStatus}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 grid grid-cols-1 lg:grid-cols-4 min-h-[600px]">
      
      {/* Grid Canvas Streaming Stage */}
      <div className="lg:col-span-3 p-6 flex flex-col justify-between border-r border-slate-800/80">
        
        {/* Hidden HTML5 video tags used as frame buffers */}
        <video ref={localVideoRef} className="hidden" muted playsInline />
        <video ref={remoteVideoRef} className="hidden" playsInline />

        {/* Video Canvas Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 flex-grow">
          {/* Main stream viewport */}
          <div className="md:col-span-2 relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden aspect-video flex items-center justify-center">
            <canvas
              ref={isTeacher ? localCanvasRef : remoteCanvasRef}
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-white font-medium">
              {isTeacher 
                ? `${isSharingScreen ? "Screen Share active" : "Camera Broadcast (Host)"}` 
                : "Instructor Video Feed"}
            </div>
            {!isTeacher && !remoteCanvasAnimRef.current && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-sm text-slate-400">
                {connectionStatus}
              </div>
            )}
          </div>

          {/* Local participant view thumbnail */}
          <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden aspect-video md:aspect-square flex items-center justify-center">
            <canvas
              ref={isTeacher ? remoteCanvasRef : localCanvasRef}
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-white font-medium">
              {isTeacher ? "Enrolled Student Feed" : "Your Video Feed (Student)"}
            </div>
            {isTeacher && Object.keys(peerConnectionsRef.current).length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-xs text-slate-500 text-center p-3">
                No active attendees connected
              </div>
            )}
          </div>
        </div>

        {/* Floating Moderator Admit Control Queue Panel (Teacher only) */}
        {isTeacher && waitingQueue.length > 0 && (
          <div className="mb-6 bg-slate-900 border border-[#3DBFF2]/30 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#3DBFF2] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Waiting Room Admission Queue ({waitingQueue.length})
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {waitingQueue.map((s) => (
                <div key={s.socketId} className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800 text-xs">
                  <span className="font-semibold text-white truncate max-w-[150px]">{s.userName}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdmit(s)}
                      className="bg-[#0B58CA] text-white font-bold px-3 py-1 rounded hover:bg-[#0B58CA]/80 transition-colors"
                    >
                      Admit
                    </button>
                    <button
                      onClick={() => handleDeny(s)}
                      className="bg-red-950 text-red-400 font-bold px-3 py-1 rounded border border-red-900 hover:bg-red-900/50 transition-colors"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Connected Students Roster Panel */}
        <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#3DBFF2] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected Students ({activeStudents.length})
          </h4>
          {activeStudents.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No other students are currently inside this lecture hall.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {activeStudents.map((s) => (
                <span
                  key={s.socketId}
                  className="bg-slate-950 text-slate-300 px-3 py-1.5 rounded-full border border-slate-800 text-xs font-medium flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {s.userName}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="text-xs font-semibold text-slate-400 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3DBFF2] animate-pulse"></span>
          Status: {connectionStatus}
        </div>

        {/* Action controls button layout */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <button
            onClick={toggleAudio}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
              audioEnabled
                ? "bg-[#0B58CA] text-white border-blue-600 hover:bg-[#0B58CA]/80"
                : "bg-red-950 text-red-200 border-red-900 hover:bg-red-900/50"
            }`}
          >
            {audioEnabled ? "Mute Mic" : "Unmute Mic"}
          </button>

          <button
            onClick={toggleVideo}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
              videoEnabled
                ? "bg-[#0B58CA] text-white border-blue-600 hover:bg-[#0B58CA]/80"
                : "bg-red-950 text-red-200 border-red-900 hover:bg-red-900/50"
            }`}
          >
            {videoEnabled ? "Disable Cam" : "Enable Cam"}
          </button>

          {isTeacher && (
            <button
              onClick={toggleScreenShare}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
                isSharingScreen
                  ? "bg-[#3DBFF2] text-slate-950 border-cyan-400 hover:bg-[#3DBFF2]/80"
                  : "bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
              }`}
            >
              {isSharingScreen ? "Stop Sharing" : "Share Screen"}
            </button>
          )}

          <button
            onClick={endStream}
            className="bg-red-600 hover:bg-red-700 text-white border border-red-500 px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ml-auto"
          >
            {isTeacher ? "End Lecture" : "Leave Session"}
          </button>
        </div>

      </div>

      {/* Real-time In-Stream Sidebar chat box */}
      <div className="p-6 flex flex-col h-[600px]">
        <h4 className="font-extrabold text-sm text-white border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
          <span>Lecture Chat Room</span>
          <span className="text-[10px] text-[#3DBFF2] bg-[#3DBFF2]/10 px-2 py-0.5 rounded-full font-bold">
            Live Synced
          </span>
        </h4>

        {/* Messages viewport */}
        <div className="flex-grow overflow-y-auto space-y-4 pr-1 mb-4 text-xs max-h-[420px]">
          {messages.length === 0 ? (
            <div className="text-slate-500 italic text-center pt-10">
              No messages sent yet. Say hello!
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span className="font-bold text-[#3DBFF2] truncate max-w-[120px]">{m.userName}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-slate-200 leading-relaxed break-words">
                  {m.text}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Messages Input form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type message..."
            className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#3DBFF2] focus:ring-1 focus:ring-[#3DBFF2]"
          />
          <button
            type="submit"
            className="bg-[#0B58CA] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#0B58CA]/85 transition-colors"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}
