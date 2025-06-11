import React, { useState } from "react";
import axios from "axios";

const CreateVoiceServer = ({ onServerCreated }) => {
  const [serverName, setServerName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    try {
      const res = await axios.post("/api/voice-servers", {
        name: serverName,
        description,
      });
      setMessage("서버 생성 완료: " + res.data.name);
      if (onServerCreated) onServerCreated(res.data);
    } catch (err) {
      setMessage("서버 생성 실패: " + err.response?.data?.message || err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>음성 서버 생성</h2>
      <input placeholder="서버 이름" value={serverName} onChange={(e) => setServerName(e.target.value)} />
      <br />
      <input placeholder="설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <br />
      <button onClick={handleCreate}>생성</button>
      <p>{message}</p>
    </div>
  );
};

export default CreateVoiceServer;
