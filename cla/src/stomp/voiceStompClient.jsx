import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let voiceStompClient = null;

export const connectStomp = (onMessage, onConnectCallback) => {
  const token = localStorage.getItem("token");
  const socket = new SockJS(`http://localhost:8080/ws-voice?token=${token}`);
  voiceStompClient = new Client({
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

  voiceStompClient.onWebSocketError = (error) => {
    console.error("❌ WebSocket Error:", error);
  };

  voiceStompClient.activate();
};

export const subscribe = (destination, callback) => {
  if (!voiceStompClient) return;
  return voiceStompClient.subscribe(destination, (msg) => {
    const data = JSON.parse(msg.body);
    callback(data);
  });
};

export const sendSpeakingStatus = (memberId, channelId, speaking) => {
  if (!voiceStompClient || !voiceStompClient.connected) return;

  const message = {
    memberId,
    channelId,
    speaking,
  };

  voiceStompClient.publish({
    destination: "/api/voice/speaking",
    body: JSON.stringify(message),
  });
};

export const sendSignaling = (type, roomId, payload) => {
  if (!voiceStompClient?.connected) return;

  voiceStompClient.publish({
    destination: `/api/voice/${type}/${roomId}`,
    body: JSON.stringify(payload),
  });
};

export const disconnectStomp = () => {
  if (voiceStompClient) {
    voiceStompClient.deactivate();
    voiceStompClient = null;
  }
};
