import { useVoiceChat } from "../../hooks/useVoiceChat";
import React from "react";

function VoiceChannelJoiner({ channelId }) {
  const { volume } = useVoiceChat(channelId);

  return (
    <div>
      🎙️ 마이크 감지: <strong>{volume}</strong> / 255
      <div style={{ height: "10px", background: "#ddd", marginTop: 5 }}>
        <div
          style={{
            width: `${(volume / 255) * 100}%`,
            height: "100%",
            background: "green",
          }}
        />
      </div>
    </div>
  );
}

export default VoiceChannelJoiner;

// import * as StompJs from "@stomp/stompjs";
// import { useEffect, useRef, useState } from "react";

// function VoiceChannelJoiner({ channelId, userId }) {
//   const audioContextRef = useRef(null);
//   const analyserRef = useRef(null);
//   const stompClientRef = useRef(null);

//   // 🔌 STOMP 연결
//   useEffect(() => {
//     const client = new StompJs.Client({
//       brokerURL: "ws://localhost:8080/ws", // Spring Boot STOMP WebSocket endpoint
//       reconnectDelay: 5000,
//       onConnect: () => {
//         console.log("✅ STOMP 연결됨");

//         client.subscribe(`/topic/room/${channelId}`, (message) => {
//           const body = JSON.parse(message.body);
//           console.log("채팅 메시지 수신:", body);
//         });

//         client.publish({
//           destination: `/app/room/${channelId}/enter`,
//           body: JSON.stringify({ userId }),
//         });
//       },
//     });

//     client.activate();
//     stompClientRef.current = client;

//     return () => {
//       client.deactivate();
//     };
//   }, [channelId, userId]);

//   // 🎙️ 마이크 연결
//   useEffect(() => {
//     const initMic = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//         const source = audioContext.createMediaStreamSource(stream);
//         const analyser = audioContext.createAnalyser();

//         source.connect(analyser);
//         analyser.fftSize = 256;
//         const dataArray = new Uint8Array(analyser.frequencyBinCount);

//         audioContextRef.current = audioContext;
//         analyserRef.current = analyser;
//       } catch (err) {
//         console.error("마이크 접근 실패:", err);
//       }
//     };

//     initMic();

//     return () => {
//       if (audioContextRef.current) {
//         audioContextRef.current.close();
//       }
//     };
//   }, []);
// }

// export default VoiceChannelJoiner;
