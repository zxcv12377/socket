import React, { useEffect, useState } from "react";
import { connectStomp, disconnectStomp, sendSpeakingStatus, subscribeToChannel } from "../stompClient";

const VoiceChannelTest = ({ channelId, memberId }) => {
  const [speakingUsers, setSpeakingUsers] = useState([]);

  useEffect(() => {
    connectStomp(() => {
      subscribeToChannel(channelId, (data) => {
        setSpeakingUsers((prev) => {
          const others = prev.filter((u) => u.memberId !== data.memberId);
          return data.speaking ? [...others, data] : others;
        });
      });
    });

    return () => {
      disconnectStomp();
    };
  }, [channelId]);

  const toggleSpeaking = (status) => {
    sendSpeakingStatus(memberId, channelId, status);
  };

  return (
    <div>
      <h2>🔊 Voice Channel {channelId}</h2>
      <p>현재 말하는 유저:</p>
      <ul>
        {speakingUsers.map((user) => (
          <li key={user.memberId}>🗣 {user.memberId}</li>
        ))}
      </ul>

      <button onMouseDown={() => toggleSpeaking(true)} onMouseUp={() => toggleSpeaking(false)}>
        🎙️ 말하기 (누르고 있는 동안)
      </button>
    </div>
  );
};

export default VoiceChannelTest;
