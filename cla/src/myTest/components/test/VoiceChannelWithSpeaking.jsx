// VoiceChannelWithSpeaking.jsx
import { useEffect, useRef, useState } from "react";
import VoiceChattest2 from "./VoiceChattest2";
import { connectStomp, disconnectStomp, sendSpeakingStatus, subscribeToChannel } from "../stompClient";

function VoiceChannelWithSpeaking({ roomId, memberId }) {
  const [speakingUsers, setSpeakingUsers] = useState([]);
  const isSpeakingRef = useRef(false);
  useEffect(() => {
    connectStomp(() => {
      subscribeToChannel(roomId, (data) => {
        setSpeakingUsers((prev) => {
          const others = prev.filter((u) => u.memberId !== data.memberId);
          return data.speaking ? [...others, data] : others;
        });
      });
    });
    return () => {
      disconnectStomp();
    };
  }, [roomId]);

  const handleSpeakingStart = () => {
    if (!isSpeakingRef.current) {
      isSpeakingRef.current = true;
      sendSpeakingStatus(memberId, roomId, true);
    }
  };

  const handleSpeakingStop = () => {
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      sendSpeakingStatus(memberId, roomId, false);
    }
  };

  return (
    <div>
      <VoiceChattest2 roomId={roomId} />

      <h4>🗣 Speaking 상태</h4>
      <ul>
        {speakingUsers.map((user) => (
          <li key={user.memberId}>{user.memberId} 님 말하는 중</li>
        ))}
      </ul>

      <button onMouseDown={handleSpeakingStart} onMouseUp={handleSpeakingStop}>
        🎤 말하기 (누르고 있는 동안)
      </button>
    </div>
  );
}
export default VoiceChannelWithSpeaking;
