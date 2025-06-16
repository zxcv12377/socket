// import { useEffect, useRef, useState } from "react";
// import { connectStomp, disconnectStomp, sendSpeakingStatus, subscribe } from "../stomp/voiceStompClient";
// import { io } from "socket.io-client";
// import { socket } from "../lib/socket";

// export default function useVoiceChannelSpeaking({ roomId, memberId, onSpeakingUsersChange }) {
//   const socketRef = useRef(null);
//   const analyserRef = useRef(null);
//   const dataArrayRef = useRef(null);
//   const speakingRef = useRef(false);
//   const animationIdRef = useRef(null);
//   const streamRef = useRef(null);

//   // 🔧 소켓 초기화 및 서버 수신
//   useEffect(() => {
//     if (!roomId || !memberId) return;

//     socket.on("speaking-users", (data) => {
//       onSpeakingUsersChange?.(data);
//     });

//     return () => {
//       stopSpeaking();
//       socket.disconnect();
//     };
//     // eslint-disable-next-line
//   }, [roomId, memberId]);

//   // 🔊 말하기 감지 시작
//   const startSpeaking = async () => {
//     if (!socketRef.current || !roomId || !memberId) return;
//     if (animationIdRef.current) return; // 이미 동작 중이면 무시

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       console.log("🎙️ 마이크 트랙:", stream.getAudioTracks());
//       streamRef.current = stream;
//       const audioContext = new AudioContext();
//       const analyser = audioContext.createAnalyser();
//       const micSource = audioContext.createMediaStreamSource(stream);
//       micSource.connect(analyser);
//       analyser.fftSize = 256;

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       analyserRef.current = analyser;
//       dataArrayRef.current = dataArray;

//       const checkSpeaking = () => {
//         analyser.getByteFrequencyData(dataArray);
//         const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
//         const isSpeaking = avg > 15; // 임계값 조정 가능

//         if (isSpeaking !== speakingRef.current) {
//           speakingRef.current = isSpeaking;
//           socketRef.current.emit("speaking", {
//             roomId,
//             memberId,
//             speaking: isSpeaking,
//           });
//         }
//         animationIdRef.current = requestAnimationFrame(checkSpeaking);
//       };
//       checkSpeaking();
//     } catch (err) {
//       console.error("🎤 마이크 접근 오류:", err);
//     }
//   };

//   // 🔇 감지 중단 및 상태 리셋
//   const stopSpeaking = () => {
//     cancelAnimationFrame(animationIdRef.current);
//     animationIdRef.current = null;
//     if (socketRef.current && speakingRef.current) {
//       socketRef.current.emit("speaking", {
//         roomId,
//         memberId,
//         speaking: false,
//       });
//     }
//     speakingRef.current = false;

//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((track) => track.stop());
//       streamRef.current = null;
//     }
//   };

//   return { startSpeaking, stopSpeaking };
// }
// // const isSpeakingRef = useRef(false);
// // useEffect(() => {
// //   connectStomp(() => {
// //     subscribe(roomId, (data) => {
// //       onSpeakingUsersChange?.(data);
// //     });
// //   });
// //   return () => {
// //     disconnectStomp();
// //   };
// // }, [roomId]);

// // const speakingStart = () => {
// //   if (!isSpeakingRef.current) {
// //     isSpeakingRef.current = true;
// //     sendSpeakingStatus(memberId, roomId, true);
// //   }
// // };

// // const speakingStop = () => {
// //   if (isSpeakingRef.current) {
// //     isSpeakingRef.current = false;
// //     sendSpeakingStatus(memberId, roomId, false);
// //   }
// // };

// // return { speakingStart, speakingStop };
// // return {
// //   startSpeaking: ()=>{}
// // }
