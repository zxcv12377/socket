const { addUserToRoom, removeUserFromRoom, findUserRoom, getRoomUsers } = require("../lib/rooms");
const { createWebRtcTransport } = require("../lib/transports");

const voiceRooms = new Map(); // Map<roomId, Set<socketId>>
const voiceRoomParticipants = new Map(); // Map<roomId, Map<socketId, memberInfo>>
const peers = new Map();
const transports = new Map();
const producers = new Map();
const consumers = new Map();
const consumerTransports = new Map();
const speakingState = new Map(); //Map<roomId, Map<memberId, {memberId, speaking}>>

function leaveVoiceRoom(io, socket) {
  for (const [roomId, userMap] of voiceRoomParticipants.entries()) {
    if (userMap.has(socket.id)) {
      userMap.delete(socket.id);
      if (userMap.size === 0) {
        voiceRoomParticipants.delete(roomId);
      }

      // ✅ voiceRooms도 정리해줘야 userCount가 정확함
      const socketSet = voiceRooms.get(roomId);
      if (socketSet) {
        socketSet.delete(socket.id);
        if (socketSet.size === 0) {
          voiceRooms.delete(roomId);
        }
      }

      // ✅ 유저 수 갱신 (voiceRooms 기준)
      const size = socketSet?.size || 0;
      io.to(roomId).emit("userCount", size);

      console.log(`❌ ${socket.id} left voice room: ${roomId} (size: ${size})`);
    }
  }
}

function setupSignaling(io, router) {
  io.on("connection", (socket) => {
    peers.set(socket.id, { socket });

    socket.on("speaking", ({ roomId, memberId, speaking }) => {
      if (!roomId || !memberId) return;

      const current = speakingState.get(roomId) || new Map();
      current.set(memberId, { memberId, speaking });
      speakingState.set(roomId, current);

      io.to(roomId).emit("speaking-users", Array.from(current.values()));
    });

    console.log(`✅ 클라이언트 연결됨 : ${socket.id}`);

    socket.on("joinRoom", ({ roomId, member }) => {
      console.log(`🔔 Room Joined: ${roomId} by ${socket.id}`);
      socket.join(roomId);
      // 방에 유저 등록
      if (!voiceRooms.has(roomId)) {
        voiceRooms.set(roomId, new Set());
      }
      voiceRooms.get(roomId).add(socket.id);

      // 유저 정보도 따로 저장
      if (!voiceRoomParticipants.has(roomId)) {
        voiceRoomParticipants.set(roomId, new Map());
      }
      voiceRoomParticipants.get(roomId).set(socket.id, member); // member = { memberId, name, profile }

      // 유저 수 갱신 브로드캐스트
      const size = voiceRooms.get(roomId).size;
      io.to(roomId).emit("userCount", size);

      console.log(`🎧 ${socket.id} joined voice room: ${roomId} (size: ${size})`);
    });

    socket.on("getRtpCapabilities", (dummy, callback) => {
      console.log("🎧 getRtpCapabilities 요청 들어옴");
      callback(router.rtpCapabilities);
    });

    socket.on("createTransport", async (callback) => {
      try {
        const transport = await createWebRtcTransport(router);
        transports.set(socket.id, transport);
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
    socket.on("connectTransport", async ({ dtlsParameters }, callback) => {
      const transport = transports.get(socket.id);
      if (transport) await transport.connect({ dtlsParameters });
      if (typeof callback === "function") {
        callback("ok");
      } else {
        console.warn("⚠️ connectTransport: callback is not a function");
      }
    });
    // 4️⃣ 오디오 데이터 전송 (produce)
    socket.on("produce", async ({ kind, rtpParameters }, callback) => {
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

        // 본인 제외 처리
        for (const [peerId, peer] of peers.entries()) {
          if (peerId !== socket.id) {
            peer.socket.emit("newProducer", {
              producerId: producer.id,
              socketId: socket.id,
            });
          }
        }

        producer.on("transportclose", () => {
          producers.delete(socket.id);
          console.log(`❌ Producer 연결 종료됨: ${producer.id}`);
        });
      } catch (error) {
        console.error("❌ Producer 생성 실패:", err);
        callback({ error: err.message });
      }
    });
    // ✅ 수신용 transport 생성
    socket.on("createRecvTransport", async (callback) => {
      try {
        const recvTransport = await createWebRtcTransport(router);
        consumerTransports.set(socket.id, recvTransport);
        callback({
          id: recvTransport.id,
          iceParameters: recvTransport.iceParameters,
          iceCandidates: recvTransport.iceCandidates,
          dtlsParameters: recvTransport.dtlsParameters,
        });
      } catch (error) {
        console.error("❌ Transport 생성 실패", err);
      }
    });
    socket.on("connectRecvTransport", async ({ dtlsParameters, transportId }) => {
      // const transport = transports.find((t) => t.id === transportId);
      const transport = [...consumerTransports.values()].find((t) => t.id === transportId);
      if (transport) await transport.connect({ dtlsParameters });
    });
    socket.on("consume", async ({ rtpCapabilities, producerSocketId }, callback) => {
      const consumerTransport = consumerTransports.get(socket.id);
      const producer = producers.get(producerSocketId);
      // const transport = transports.get(socket.id);
      if (!consumerTransport || !producer) {
        return callback({ error: "❌ consumer transport or producer not found" });
      }
      if (!consumerTransport) return callback({ error: "❌ Transport를 찾을 수 없음" });
      let roomId;
      for (const [rid, socketMap] of voiceRoomParticipants.entries()) {
        if (socketMap.has(socket.id)) {
          roomId = rid;
          break;
        }
      }
      if (!roomId || !consumerTransport) return callback({ error: "❌ Room을 찾을 수 없음" });

      if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
        console.warn("❌ consume 불가한 producer: ", producer.id);
        return callback({ error: "cannot consume" });
      }

      const consumer = await consumerTransport.consume({ producerId: producer.id, rtpCapabilities, paused: false });

      consumers.set(socket.id, consumer);

      callback({
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        producerId: producer.id,
      });

      // results.push({
      //   peerId,
      //   id: consumer.id,
      //   kind: consumer.kind,
      //   rtpParameters: consumer.rtpParameters,
      //   producerId: producer.id,
      // });
      // for (const peerId of getRoomUsers(roomId)) {
      // }

      // callback(results);
    });

    socket.on("leaveRoom", (roomId) => {
      console.log(roomId + "번 방을 떠남");
      leaveVoiceRoom(io, socket);
    });

    // 🔚 연결 해제 시 정리
    socket.on("disconnect", () => {
      leaveVoiceRoom(io, socket);

      const producer = producers.get(socket.id);
      const transport = transports.get(socket.id);
      if (producer) producer.close();
      if (transport) transport.close();

      peers.delete(socket.id);
      transports.delete(socket.id);
      consumerTransports.delete(socket.id);
      producers.delete(socket.id);
      consumers.delete(socket.id);
      console.log(`🚫 클라이언트 연결 해제됨: ${socket.id}`);
    });
  });
}

module.exports = { setupSignaling, voiceRoomParticipants };
