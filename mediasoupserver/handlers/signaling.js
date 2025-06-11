const { addUserToRoom, removeUserFromRoom, findUserRoom, getRoomUsers } = require("../lib/rooms");
const { createWebRtcTransport } = require("../lib/transports");

const peers = new Map();
const transports = new Map();
const producers = new Map();
const consumers = new Map();

function setupSignaling(io, router) {
  io.on("connection", (socket) => {
    console.log(`✅ 클라이언트 연결됨 : ${socket.id}`);

    peers.set(socket.id, { socket });

    socket.on("joinRoom", (roomId) => {
      console.log(`🔔 Room Joined: ${roomId} by ${socket.id}`);
      socket.join(roomId);

      const count = addUserToRoom(roomId, socket.id);
      io.to(roomId).emit("userCount", count);
    });

    socket.on("getRtpCapabilities", (_, cb) => cb(router.rtpCapabilities));

    socket.on("createTransport", async (cb) => {
      try {
        const transport = await createWebRtcTransport(router);
        transports.set(socket.id, transport);
        cb({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (error) {
        console.error("❌ Transport 생성 실패", err);
      }
    });

    // 3️⃣ 클라이언트에서 Transport 연결 시
    socket.on("connectTransport", async ({ dtlsParameters }) => {
      const transport = transports.get(socket.id);
      if (transport) await transport.connect({ dtlsParameters });
    });
    // 4️⃣ 오디오 데이터 전송 (produce)
    socket.on("produce", async ({ kind, rtpParameters }, cb) => {
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
            cb({ id: producer.id });

            producer.on("transportclose", () => {
              console.log(`❌ Producer 연결 종료됨: ${producer.id}`);
              producers.delete(socket.id);
            });
          } catch (error) {
            console.error("❌ Producer 생성 실패:", err);
            cb({ error: err.message });
          }
        }
      }
    });

    socket.on("consume", async ({ rtpCapabilities }, cb) => {
      const transport = transports.get(socket.id);
      if (!transport) return callback({ error: "❌ Transport를 찾을 수 없음" });
      const roomId = findUserRoom(socket.id);
      if (!roomId || !transport) return cb({ error: "❌ Room을 찾을 수 없음" });

      const results = [];
      for (const peerId of getRoomUsers(roomId)) {
        if (peerId === socket.id) continue; // 자기 자신 제외
        const producer = producers.get(peerId);
        if (!producer) continue;

        if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
          console.warn("❌ consume 불가한 producer: ", producer.id);
          continue;
        }

        const consumer = await transport.consume({ producerId: producer.id, rtpCapabilities, paused: false });
        consumers.set(socket.id, consumer);
        results.push({
          peerId,
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          producerId: producer.id,
        });
      }

      cb(results);
    });

    // 🔚 연결 해제 시 정리
    socket.on("disconnect", () => {
      const left = removeUserFromRoom(socket.id);
      if (left) io.to(left.roomId).emit("userCount", left.size);
      console.log(`❌ 연결 종료: ${socket.id}`);
      // for (const [roomId, users] of roomUsers.entries()) {
      //   if (users.has(socket.id)) {
      //     users.delete(socket.id);
      //     io.to(roomId).emit("userCount", users.size);
      //     if (users.size === 0) {
      //       roomUsers.delete(roomId);
      //     }
      //     // else {
      //     //   io.to(roomId).emit("userCount", users.size);
      //     // }
      //     break;
      //   }
      // }
      peers.delete(socket.id);
      transports.delete(socket.id);
      producers.delete(socket.id);
      consumers.delete(socket.id);
      console.log(`🚫 클라이언트 연결 해제됨: ${socket.id}`);
    });
  });
}

module.exports = { setupSignaling };
