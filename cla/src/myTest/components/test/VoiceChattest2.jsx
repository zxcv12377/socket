import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import MicTest from "../MicTest";
import useUserCount from "../../hook/useUserCount";

function VoiceChattest2({ roomId }) {
  const [connected, setConnected] = useState(false);
  const userCount = useUserCount(roomId);
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);

  const connectToMediasoup = useCallback(async () => {
    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", async () => {
      try {
        console.log("✅ 서버 연결됨");
        setConnected(true);

        const rtpCapabilities = await getRtpCapabilities(socket);
        await loadDevice(rtpCapabilities);
        console.log("loadDevice 성공");

        const sendParams = await createTransport(socket);
        await createSendTransport(socket, sendParams);
        console.log("createSendTransport 성공");

        const recvParams = await createTransport(socket);
        await createRecvTransport(socket, recvParams);
        console.log("createRecvTransport 성공");
      } catch (err) {
        console.error("❌ 초기 연결 실패:", err);
      }
    });
  }, []);

  const getRtpCapabilities = (socket) => {
    return new Promise((resolve) => {
      socket.emit("getRtpCapabilities", null, (rtpCapabilities) => {
        resolve(rtpCapabilities);
      });
    });
  };

  const loadDevice = async (rtpCapabilities) => {
    const device = new mediasoupClient.Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    deviceRef.current = device;
  };

  const createTransport = (socket) => {
    return new Promise((resolve) => {
      socket.emit("createTransport", (params) => {
        resolve(params);
      });
    });
  };

  const createSendTransport = async (socket, params) => {
    const device = deviceRef.current;
    const transport = device.createSendTransport(params);
    sendTransportRef.current = transport;

    transport.on("connect", ({ dtlsParameters }, callback) => {
      socket.emit("connectTransport", { dtlsParameters });
      callback();
    });

    transport.on("produce", ({ kind, rtpParameters }, callback) => {
      socket.emit("produce", { kind, rtpParameters }, ({ id }) => {
        callback({ id });
      });
    });

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const track = stream.getAudioTracks()[0];
    await transport.produce({ track });
  };

  const createRecvTransport = async (socket, params) => {
    const device = deviceRef.current;
    const transport = device.createRecvTransport(params);
    recvTransportRef.current = transport;

    transport.on("connect", ({ dtlsParameters }, callback) => {
      socket.emit("connectTransport", { dtlsParameters });
      callback();
    });

    // consume 요청: 서버에 등록된 producer 정보로부터 audio 소비
    socket.emit(
      "consume",
      { producerId: "replace-this-with-actual-producerId", rtpCapabilities: device.rtpCapabilities },
      async ({ id, kind, rtpParameters }) => {
        const consumer = await transport.consume({
          id,
          producerId: "replace-this-with-actual-producerId",
          kind,
          rtpParameters,
        });

        const { track } = consumer;
        const stream = new MediaStream([track]);
        audioRef.current.srcObject = stream;
        audioRef.current.play();
      }
    );
  };

  useEffect(() => {
    connectToMediasoup();
  }, [connectToMediasoup, roomId]);

  return (
    <div>
      <h3>🎙️ 음성 채팅 (Room ID: {roomId})</h3>
      <p>현재 접속 인원: 👥 {userCount}명</p>
      <p>상태: {connected ? "🟢 연결됨" : "🔴 연결 안됨"}</p>
      <button onClick={connectToMediasoup}>🔁 연결 재시도</button>
      <MicTest />
      <audio ref={audioRef} autoPlay controls />
    </div>
  );
}

export default VoiceChattest2;
