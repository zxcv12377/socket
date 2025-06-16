import * as mediasoupClient from "mediasoup-client";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { socket } from "../lib/socket";

export function useVoiceChat(roomId, member, onSpeakingUsersChange) {
  // const [volume, setVolume] = useState(0);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const speakingRef = useRef(false);
  const animationIdRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportsRef = useRef([]);
  const audioElementsRef = useRef({});
  // const audioContextRef = useRef(null);

  useEffect(() => {
    if (!roomId || !member) return;

    socketRef.current = socket;

    const start = async () => {
      if (!member) return;
      // 1. 채널 입장
      // socket.on("joinRoom", ({ roomId, member }) => {
      //   console.log(`🔔 Room Joined: ${roomId} by ${socket.id}`);
      //   console.log("➡️ member 정보:", member);
      socket.emit("joinRoom", {
        roomId,
        member: {
          memberId: member.mno,
          name: member.name,
          profile: member.profile || "",
        },
      });

      // 2. 마이크 스트림 획득
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("🎙️ 마이크 트랙:", stream.getAudioTracks());
      const audioTrack = stream.getAudioTracks()[0];

      // 3. speaking 감지 준비
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const micSource = audioContext.createMediaStreamSource(stream);
      micSource.connect(analyser);
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      // 4. RTP Capabilities 요청 → device 생성
      socket.emit("getRtpCapabilities", null, async (rtpCapabilities) => {
        const device = new mediasoupClient.Device();
        await device.load({ routerRtpCapabilities: rtpCapabilities });
        console.log("✅ rtpCapabilities 수신:", rtpCapabilities);
        deviceRef.current = device;
        console.log(device);
        // 5. 송신 Transport 생성
        socket.emit("createTransport", async (params) => {
          const sendTransport = device.createSendTransport(params);
          console.log("여기는 되것지?");
          sendTransportRef.current = sendTransport; // 이거 위치는 상관없나?

          sendTransport.on("connect", ({ dtlsParameters }, callback) => {
            socket.emit("connectTransport", { dtlsParameters });
            console.log("연결 완료");
            callback();
          });

          sendTransport.on("produce", ({ kind, rtpParameters }, callback) => {
            socket.emit("produce", { kind, rtpParameters }, ({ id }) => callback({ id }));
            console.log("🎤 오디오 트랙 등록 완료");
          });

          await sendTransport.produce({ track: audioTrack });
        });
      });

      // 6. 소비자 수신 처리
      socket.on("newProducer", async ({ producerId, socketId }) => {
        console.log("🆕 새로운 producer 수신:", producerId, socketId);
        const device = deviceRef.current;
        if (!device) return;
        // 수신용 트랜스포트 요청
        socket.emit("createRecvTransport", async (params) => {
          const recvTransport = device.createRecvTransport(params);

          recvTransport.on("connect", ({ dtlsParameters }, callback) => {
            socket.emit("connectRecvTransport", {
              dtlsParameters,
              transportId: recvTransport.id,
            });
            callback();
          });

          // consume 요청
          socket.emit(
            "consume",
            {
              rtpCapabilities: device.rtpCapabilities,
              producerSocketId: socketId,
              // transportId: recvTransport.id,
            },
            async ({ id, kind, rtpParameters, producerId }) => {
              const consumer = await recvTransport.consume({
                id,
                producerId,
                kind,
                rtpParameters,
              });

              const stream = new MediaStream([consumer.track]);
              const audio = new Audio();
              audio.srcObject = stream;
              audio.autoplay = true;
              console.log("🔊 consumer 생성됨", consumer);
              console.log("🔈 stream 생성됨", stream);
              audio
                .play()
                .then(() => {
                  console.log("✅ 오디오 재생 시작됨");
                })
                .catch((err) => {
                  console.error("🔇 오디오 재생 실패", err);
                });

              audioElementsRef.current[producerId] = audio;
              recvTransportsRef.current.push(recvTransport);
            }
          );
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
      // 7. 말하기 감지 및 emit
      const checkSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const isSpeaking = avg > 15;

        if (isSpeaking !== speakingRef.current) {
          speakingRef.current = isSpeaking;
          socket.emit("speaking", {
            roomId,
            memberId: member.memberId,
            speaking: isSpeaking,
          });
        }

        animationIdRef.current = requestAnimationFrame(checkSpeaking);
      };
      checkSpeaking();

      // 8. 다른 사용자 speaking 수신
      socket.on("speaking-users", (list) => {
        onSpeakingUsersChange?.(list);
      });
    };

    start();

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("newProducer");
      socket.off("speaking-users");

      streamRef.current?.getTracks().forEach((t) => t.stop());
      sendTransportRef.current?.close();
      recvTransportsRef.current.forEach((t) => t.close());
      Object.values(audioElementsRef.current).forEach((a) => {
        a.srcObject?.getTracks().forEach((t) => t.stop());
        a.remove();
      });

      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);

      // socketRef.current?.disconnect();
      // sendTransportRef.current?.close();
      // recvTransportsRef.current.forEach((t) => t.close());

      // Object.values(audioElementsRef.current).forEach((audio) => {
      //   audio.srcObject?.getTracks().forEach((track) => track.stop());
      //   audio.remove();
      // });
    };
  }, [roomId, member]);
  // return { volume };
  return {};
  // return {
  //   // 수동 사용시 이걸로 바꾸면 됨
  //   startSpeaking: () => socket.emit("speaking", { roomId, memberId: member.memberId, speaking: true }),
  //   stopSpeaking: () => socket.emit("speaking", { roomId, memberId: member.memberId, speaking: false }),
  // };
}
