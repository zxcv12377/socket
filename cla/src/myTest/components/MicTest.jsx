import { useEffect, useRef, useState } from "react";

function MicTest() {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      source.connect(analyser);
      analyser.fftSize = 256;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      // const updateVolume = () => {
      //   analyser.getByteFrequencyData(dataArray);
      //   const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
      //   setVolume(Math.round(avg));
      //   requestAnimationFrame(updateVolume);
      // };

      // updateVolume();
    };

    init();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div>
      🎙️ 마이크 입력 감지: <strong>{volume}</strong> / 255
      <div style={{ width: "100%", height: "10px", background: "#ddd", marginTop: "5px" }}>
        <div
          style={{
            width: `${(volume / 255) * 100}%`,
            height: "100%",
            background: "green",
          }}
        />
      </div>
    </div>
  );
}

export default MicTest;
