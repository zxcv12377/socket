import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

export const connectStomp = (onMessage, onConnectCallback) => {
  const socket = new SockJS("http://localhost:8080/ws");
  stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    onConnect: () => {
      console.log("🔗 STOMP Connected");
      if (onConnectCallback) onConnectCallback();
    },
    onStompError: (frame) => {
      console.error("❌ STOMP Error:", frame.headers["message"], frame.body);
    },
  });

  stompClient.onWebSocketError = (error) => {
    console.error("❌ WebSocket Error:", error);
  };

  stompClient.activate();
};

export const subscribeToChannel = (channelId, onMessage) => {
  if (!stompClient) return;
  stompClient.subscribe(`/topic/voice/${channelId}/speaking`, (msg) => {
    const body = JSON.parse(msg.body);
    console.log("📩 speaking 상태 수신:", body);
    if (onMessage) onMessage(body);
  });
};

export const sendSpeakingStatus = (memberId, channelId, speaking) => {
  if (!stompClient || !stompClient.connected) return;

  const message = {
    memberId,
    channelId,
    speaking,
  };

  stompClient.publish({
    destination: "/app/voice/speaking",
    body: JSON.stringify(message),
  });
};

export const disconnectStomp = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};
