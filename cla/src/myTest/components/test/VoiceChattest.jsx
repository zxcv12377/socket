import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import MicTest from "../MicTest";
import { useState } from "react";

function VoiceChattest({ roomId }) {
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);

  const [connected, setConnected] = useState(false);

  const connectToMediasoup = async () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      console.log("🔌 기존 소켓 연결 해제");
    }

    const socket = io("http://localhost:3001"); // mediasoup 서버 주소
    socketRef.current = socket; // 소켓 연결

    deviceRef.current = new mediasoupClient.Device(); // Device 초기화

    socket.on("connect", async () => {
      console.log("✅ mediasoup 서버 연결");
      setConnected(true);

      const device = new mediasoupClient.Device();
      deviceRef.current = device;

      // 1. 라우터 RTP 능력 요청
      socket.emit("getRtpCapabilities", null, async (rtpCapabilities) => {
        await device.load({ routerRtpCapabilities: rtpCapabilities });

        // 2. transport 생성 요청
        socket.emit("createTransport", async (transportParams) => {
          const transport = device.createSendTransport(transportParams);
          sendTransportRef.current = transport;

          transport.on("connect", ({ dtlsParameters }, callback) => {
            socket.emit("connectTransport", { dtlsParameters });
            callback();
          });

          transport.on("produce", ({ kind, rtpParameters }, callback) => {
            socket.emit("produce", { kind, rtpParameters }, ({ id }) => {
              callback({ id });

              socket.emit(
                "createConsumerTransport",
                { producerId: id, rtpCapabilities: device.rtpCapabilities },
                async (data) => {
                  const recvTransport = device.createRecvTransport(data.transportParams);
                  recvTransportRef.current = recvTransport;

                  recvTransport.on("connect", ({ dtlsParameters }, callback) => {
                    socket.emit("connectConsumerTransport", { dtlsParameters });
                    callback();
                  });

                  const consumer = await recvTransport.consume({
                    id: data.id,
                    producerId: data.producerId,
                    kind: data.kind,
                    rtpParameters: data.rtpParameters,
                  });

                  const remoteStream = new MediaStream();
                  remoteStream.addTrack(consumer.track);
                  audioRef.current.srcObject = remoteStream;
                }
              );
            });
          });
          // 3. 오디오 트랙 전송 시작
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const track = stream.getAudioTracks()[0];
          await transport.produce({ track });
          // socket.emit("createConsumerTransport", async (params) => {
          //   const recvTransport = device.createRecvTransport(params);
          //   recvTransportRef.current = recvTransport;

          //   recvTransport.on("connect", ({ dtlsParameters }, callback) => {
          //     socket.emit("connectConsumerTransport", { dtlsParameters });
          //     callback();
          //   });

          //   socket.emit("consume", { rtpCapabilities: device.rtpCapabilities }, async (data) => {
          //     const { id, producerId, kind, rtpParameters } = data;

          //     const consumer = await recvTransport.consume({
          //       id,
          //       producerId,
          //       kind,
          //       rtpParameters,
          //     });

          //     const remoteStream = new MediaStream([consumer.track]);
          //     if (audioRef.current) {
          //       audioRef.current.srcObject = remoteStream;
          //       audioRef.current.play();
          //     }
          //   });
          // });
        });
      });
    });
    socket.on("disconnect", () => {
      console.log("⚠️ 서버와 연결 끊김");
      setConnected(false);
    });
  };
  useEffect(() => {
    connectToMediasoup(); // 최초 1회 연결

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [roomId]);

  return (
    <div>
      <h3>🎙️ 음성 채팅 (Room ID: {roomId})</h3>
      <p>상태: {connected ? "🟢 연결됨" : "🔴 연결 안됨"}</p>
      <button onClick={connectToMediasoup}>🔁 연결 재시도</button>
      <MicTest />
      <audio ref={audioRef} autoPlay controls />
    </div>
  );
}

export default VoiceChattest;
