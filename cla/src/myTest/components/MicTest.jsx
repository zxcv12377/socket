import { useEffect, useRef, useState } from "react";

export default function MicTest() {
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    let audioContext;
    let stream;

    const startMic = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyserRef.current = analyser;

        const detectSpeaking = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b) / bufferLength;
          setVolume(Math.round(avg));
          setIsSpeaking(avg > 15);
          animationRef.current = requestAnimationFrame(detectSpeaking);
        };

        detectSpeaking();
      } catch (err) {
        console.error("🎙️ 마이크 접근 실패", err);
      }
    };

    startMic();

    return () => {
      cancelAnimationFrame(animationRef.current);
      stream?.getTracks().forEach((track) => track.stop());
      audioContext?.close();
    };
  }, []);

  return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <h2>🎙️ 마이크 테스트</h2>
      <p>
        현재 볼륨: <strong>{volume}</strong>
      </p>
      <p style={{ color: isSpeaking ? "limegreen" : "gray" }}>{isSpeaking ? "🗣️ 말하는 중" : "조용함"}</p>
    </div>
  );
}
