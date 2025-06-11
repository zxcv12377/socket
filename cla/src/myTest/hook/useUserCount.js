import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function useUserCount(roomId) {
  const [userCount, setUserCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.emit("joinRoom", roomId);
    // console.log(`🔔 Room Joined: ${roomId} by ${socket.id}`);
    socket.on("userCount", (count) => setUserCount(count));

    return () => socket.disconnect();
  }, [roomId]);

  return userCount;
}
