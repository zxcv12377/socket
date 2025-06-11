import * as mediasoupClient from "mediasoup-client";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export function useVoiceChat(channelId) {
  const [volume, setVolume] = useState(0);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    const start = async () => {
      socketRef.current = io("http://localhost:3001");
      const socket = socketRef.current;

      // 1. 채널 입장
      socket.emit("joinRoom", channelId);

      // 2. 마이크 스트림 획득
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];

      // 3. 서버로부터 RTP capabilities 획득 → device 초기화
      socket.emit("getRtpCapabilities", null, async (rtpCapabilities) => {
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
        deviceRef.current = device;

        // 4. 서버에 WebRTC transport 생성 요청
        socket.emit("createTransport", async (params) => {
          const sendTransport = device.createSendTransport(params);

          sendTransport.on("connect", ({ dtlsParameters }, callback) => {
            socket.emit("connectTransport", { dtlsParameters });
            callback();
          });

          sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
            socket.emit("produce", { kind, rtpParameters }, ({ id }) => callback({ id }));
          });

          await sendTransport.produce({ track: audioTrack });
          sendTransportRef.current = sendTransport;
        });
      });

      // 🔊 볼륨 시각화
      // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // const analyser = audioContext.createAnalyser();
      // const micSource = audioContext.createMediaStreamSource(stream);
      // micSource.connect(analyser);
      // analyser.fftSize = 256;
      // const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // const updateVolume = () => {
      //   analyser.getByteFrequencyData(dataArray);
      //   const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
      //   setVolume(Math.round(avg));
      //   requestAnimationFrame(updateVolume);
      // };
      // updateVolume();
      // audioContextRef.current = audioContext;
    };

    start();

    return () => {
      socketRef.current?.disconnect();
      // audioContextRef.current?.close();
    };
  }, [channelId]);

  return { volume };
}
