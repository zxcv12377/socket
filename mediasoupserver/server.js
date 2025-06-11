const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { createMediasoupWorkerAndRouter } = require("./lib/mediasoup");
const { setupSignaling } = require("./handlers/signaling");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
});

app.use(express.json());

(async () => {
  const { worker, router } = await createMediasoupWorkerAndRouter();
  setupSignaling(io, router);
})();

server.listen(3001, () => {
  console.log("🎤 mediasoup signaling 서버 실행 중 → http://localhost:3001");
});
