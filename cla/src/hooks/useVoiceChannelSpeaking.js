import { useEffect, useRef, useState } from "react";
import { connectStomp, disconnectStomp, sendSpeakingStatus, subscribe } from "../stomp/voiceStompClient";

export default function VoiceChannelSpeaking({ roomId, memberId, onSpeaking, onSpeakingUsersChange }) {
  const isSpeakingRef = useRef(false);
  useEffect(() => {
    connectStomp(() => {
      subscribe(roomId, (data) => {
        onSpeakingUsersChange?.(data);
      });
    });
    return () => {
      disconnectStomp();
    };
  }, [roomId]);

  const speakingStart = () => {
    if (!isSpeakingRef.current) {
      isSpeakingRef.current = true;
      sendSpeakingStatus(memberId, roomId, true);
    }
  };

  const speakingStop = () => {
    if (isSpeakingRef.current) {
      isSpeakingRef.current = false;
      sendSpeakingStatus(memberId, roomId, false);
    }
  };

  return { speakingStart, speakingStop };
}
