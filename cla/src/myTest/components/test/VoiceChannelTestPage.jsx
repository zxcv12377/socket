import React from "react";
import VoiceChannelWithSpeaking from "../components/VoiceChannelWithSpeaking";

function VoiceChannelTestPage() {
  // 예시 값: 실제 앱에서는 로그인 사용자 정보에서 받아올 것
  const roomId = 1;
  const memberId = 101; // 실제 memberId로 교체 필요

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🎧 Voice Channel 통합 테스트</h2>
      <VoiceChannelWithSpeaking roomId={roomId} memberId={memberId} />
    </div>
  );
}

export default VoiceChannelTestPage;
