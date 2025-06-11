import { useEffect, useRef, useState } from "react";

function ChatRoom({ postId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch(`http://localhost:8080/api/chat/${postId}`);
      const history = await res.json();
      setMessages(history); // 🔁 기존 메시지 미리 세팅
    };

    fetchHistory();

    const socket = new WebSocket("ws://localhost:8080/ws/chat"); // ✅ new 사용
    socketRef.current = socket;

    socket.onopen = () => console.log("✅ WebSocket 연결 성공");
    socket.onerror = (e) => console.error("❌ WebSocket 연결 오류", e);
    socket.onclose = () => console.log("🔌 WebSocket 연결 종료");

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.roomId === postId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    return () => {
      socket.close();
    };
  }, [postId]);

  const sendMessage = () => {
    const msg = {
      sender: "user1", // 실제 로그인 사용자 정보로 대체
      content: input,
      roomId: postId,
    };
    socketRef.current.send(JSON.stringify(msg));
    setInput("");
  };

  return (
    <div>
      <h3>채팅방 (게시글 ID: {postId})</h3>
      <div style={{ border: "1px solid #ccc", height: "200px", overflowY: "scroll", padding: "10px" }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.sender}</b>: {msg.content}
          </div>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>보내기</button>
    </div>
  );
}

export default ChatRoom;
