const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mediasoup = require("mediasoup");
const { error } = require("console");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" },
});

// 전역 변수 선언
let worker;
let router;
let peers = new Map();
let transports = new Map();
let producers = new Map();
let consumers = new Map();
const roomUsers = new Map();

app.use(express.json());

function findUserRoom(socketId) {
  for (const [roomId, users] of roomUsers.entries()) {
    if (users.has(socketId)) return roomId;
  }
  return null;
}

(async () => {
  worker = await mediasoup.createWorker();
  router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
    ],
  });

  // ✅ 소켓 연결 시 처리
  io.on("connection", (socket) => {
    console.log(`✅ 클라이언트 연결됨 : ${socket.id}`);

    peers.set(socket.id, { socket });
    socket.on("joinRoom", (roomId) => {
      console.log(`🔔 Room Joined: ${roomId} by ${socket.id}`); // ❗이게 undefined면 이상한 거야
      // 채널에 참가
      socket.join(roomId);

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.id);
      const count = roomUsers.get(roomId).size;
      // users.add(socket.id);

      // 브로드캐스트
      io.to(roomId).emit("userCount", count);
    });
    // 1️⃣ 클라이언트의 rtpCapabilities 요청 처리
    socket.on("getRtpCapabilities", (_, callback) => {
      callback(router.rtpCapabilities);
    });

    // 2️⃣ WebRTC Transport 생성 요청 처리
    socket.on("createTransport", async (callback) => {
      try {
        // listenIps는 실제 배포시 외부 접근 가능한 IP가 필요함
        const transport = await router.createWebRtcTransport({
          listenIps: [{ ip: "127.0.0.1", announcedIp: null }],
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
        });

        transports.set(socket.id, transport);

        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (err) {
        console.error("❌ Transport 생성 실패", err);
      }
    });

    // 3️⃣ 클라이언트에서 Transport 연결 시
    socket.on("connectTransport", async ({ dtlsParameters }) => {
      const transport = transports.get(socket.id);
      if (transport) await transport.connect({ dtlsParameters });
    });

    // 4️⃣ 오디오 데이터 전송 (produce)
    socket.on("produce", async ({ kind, rtpParameters }, callback) => {
      for (const [peerId, producer] of producers.entries()) {
        if (peerId !== socket.id) {
          const transport = transports.get(socket.id);
          if (!transport) {
            console.warn(`[produce] ❌ 전송용 transport 없음: ${socket.id}`);
            return;
          }
          try {
            const producer = await transport.produce({ kind, rtpParameters });
            producers.set(socket.id, producer);

            console.log(`🎤 오디오 트랙 등록됨 - Producer ID: ${producer.id}`);
            callback({ id: producer.id });

            producer.on("transportclose", () => {
              console.log(`❌ Producer 연결 종료됨: ${producer.id}`);
              producers.delete(socket.id);
            });
          } catch (error) {
            console.error("❌ Producer 생성 실패:", err);
            callback({ error: err.message });
          }
        }
      }
    });

    // 5️⃣ 오디오 데이터 수신 (consume)
    socket.on("consume", async ({ rtpCapabilities }, callback) => {
      const transport = transports.get(socket.id);
      if (!transport) return callback({ error: "❌ Transport를 찾을 수 없음" });

      const roomId = findUserRoom(socket.id); // 현재 socket이 속한 room 찾기
      if (!roomId) return callback({ error: "Room not found" });

      const consumersInfo = [];

      for (const peerId of roomUsers.get(roomId) || []) {
        if (peerId === socket.id) continue; // 자기 자신 제외
        const producer = producers.get(peerId);
        if (!producer) continue;

        if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
          console.warn("❌ consume 불가한 producer: ", producer.id);
          continue;
        }

        const consumer = await transport.consume({
          producerId: producer.id,
          rtpCapabilities,
          paused: false,
        });

        consumers.set(socket.id, consumer);
        consumersInfo.push({
          peerId,
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          producerId: producer.id,
        });
      }

      callback(consumersInfo);
    });

    // 🔚 연결 해제 시 정리
    socket.on("disconnect", () => {
      console.log(`❌ 연결 종료: ${socket.id}`);
      for (const [roomId, users] of roomUsers.entries()) {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          io.to(roomId).emit("userCount", users.size);
          if (users.size === 0) {
            roomUsers.delete(roomId);
          }
          // else {
          //   io.to(roomId).emit("userCount", users.size);
          // }
          break;
        }
      }
      peers.delete(socket.id);
      transports.delete(socket.id);
      producers.delete(socket.id);
      consumers.delete(socket.id);
      console.log(`🚫 클라이언트 연결 해제됨: ${socket.id}`);
    });
  });
})();

// 🔊 서버 시작
server.listen(3001, () => {
  console.log("mediasoup SFU 서버 실행 중: http://localhost:3001");
});
