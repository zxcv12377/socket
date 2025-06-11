import { createWebRtcTransport } from "./lib/transports.js";

export function handlePeerConnection(socket, router) {
  const transports = [];

  // 2️⃣ WebRTC Transport 생성 요청 처리
  socket.on("createTransport", async (_, callback) => {
    const transport = await createWebRtcTransport(router);
    transports.push(transport);
    try {
      callback({
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
  socket.on("connectTransport", async ({ transportId, dtlsParameters }) => {
    const transport = transports.find((t) => t.id === transportId);
    if (transport) await transport.connect({ dtlsParameters });
  });
  // 4️⃣ 오디오 데이터 전송 (produce)
  socket.on("produce", async ({ transportId, kind, rtpParameters }, callback) => {
    for (const [peerId, producer] of producers.entries()) {
      if (peerId !== socket.id) {
        const transport = transports.find((t) => t.id === transportId);
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
  socket.on("consume", async ({ transportId, rtpCapabilities }, callback) => {
    const transport = transports.find((t) => t.id === transportId);
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

  socket.on("disconnect", () => {
    console.log(`❌ 연결 종료: ${socket.id}`);
    for (const [roomId, users] of roomUsers.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        io.to(roomId).emit("userCount", users.size);
        if (users.size === 0) {
          roomUsers.delete(roomId);
        }
        break;
      }
    }
    transports.forEach((t) => t.close());
    peers.delete(socket.id);
    producers.delete(socket.id);
    consumers.delete(socket.id);
    console.log(`🚫 클라이언트 연결 해제됨: ${socket.id}`);
  });
}
