import { useEffect, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

export const useWebSocket = (token, onConnect) => {
  const stompRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!token) return;

    // ✅ 중복 연결 방지
    if (stompRef.current && stompRef.current.connected) {
      console.log("⚠️ WebSocket already connected");
      return;
    }

    const socket = new SockJS("http://localhost:8080/ws-chat");
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect(
      { Authorization: "Bearer " + localStorage.getItem("token") },
      () => {
        stompRef.current = client;
        setConnected(true);
        console.log("✅ WebSocket connected");
        onConnect?.();
      },
      (err) => {
        console.error("❌ WebSocket connection error:", err);
        setConnected(false);
      }
    );
  }, [token]);

  const disconnect = useCallback(() => {
    if (stompRef.current && stompRef.current.connected) {
      stompRef.current.disconnect(() => {
        console.log("🔌 WebSocket disconnected");
        setConnected(false);
        stompRef.current = null;
      });
    }
  }, []);

  const subscribe = useCallback(
    (topic, callback) => {
      if (!stompRef.current || !connected) {
        console.warn(`⛔ Cannot subscribe to ${topic} – not connected`);
        return { unsubscribe: () => {} };
      }

      const sub = stompRef.current.subscribe(topic, (msg) => {
        callback(JSON.parse(msg.body));
      });

      return {
        unsubscribe: () => {
          try {
            sub.unsubscribe();
          } catch (e) {
            console.warn("❗ unsubscribe failed", e);
          }
        },
      };
    },
    [connected]
  );

  const send = useCallback(
    (destination, body) => {
      if (stompRef.current && connected) {
        stompRef.current.send(destination, {}, JSON.stringify(body));
      } else {
        console.warn("❌ Cannot send message – not connected");
      }
    },
    [connected]
  );

  useEffect(() => {
    if (token) connect();
    return () => disconnect(); // cleanup on unmount
  }, [token, connect, disconnect]);

  return {
    connected,
    subscribe,
    send,
    connect,
    disconnect, // 👉 외부에서 로그아웃 시 호출용
  };
};
