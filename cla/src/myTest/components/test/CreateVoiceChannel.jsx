import React, { useState } from "react";
import axios from "axios";

const CreateVoiceChannel = ({ onChannelCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    try {
      const res = await axios.post("/api/voice-channels", {
        name,
        description,
      });
      setMessage("채널 생성 완료: " + res.data.name);
      if (onChannelCreated) onChannelCreated(res.data);
    } catch (err) {
      setMessage("채널 생성 실패: " + err.response?.data?.message || err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>음성 채널 생성</h2>
      <input placeholder="채널 이름" value={name} onChange={(e) => setName(e.target.value)} />
      <br />
      <input placeholder="설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} />
      <br />
      <button onClick={handleCreate}>생성</button>
      <p>{message}</p>
    </div>
  );
};

export default CreateVoiceChannel;
