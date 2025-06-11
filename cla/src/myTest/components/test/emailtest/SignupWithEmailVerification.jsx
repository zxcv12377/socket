import React, { useState } from "react";
import axios from "axios";

const SignupWithEmailVerification = () => {
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    code: "",
  });
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendEmail = async () => {
    try {
      await axios.post("/api/auth/email/send", { username: form.username });
      setSent(true);
      setMessage("인증 코드가 이메일로 전송되었습니다.");
    } catch (err) {
      setMessage("이메일 전송 실패: " + err.response?.data?.message);
    }
  };

  const verifyCode = async () => {
    try {
      await axios.post("/api/auth/email/verify", {
        username: form.username,
        code: form.code,
      });
      setVerified(true);
      setMessage("이메일 인증 성공!");
    } catch (err) {
      setMessage("인증 실패: " + err.response?.data?.message);
    }
  };

  const register = async () => {
    try {
      await axios.post("/api/members/register", {
        username: form.username,
        name: form.name,
        password: form.password,
      });
      setMessage("회원가입 완료!");
    } catch (err) {
      setMessage("회원가입 실패: " + err.response?.data?.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto" }}>
      <h2>회원가입</h2>
      <input name="username" placeholder="이메일" value={form.username} onChange={handleChange} />
      <br />
      <input name="name" placeholder="이름" value={form.name} onChange={handleChange} />
      <br />
      <input name="password" placeholder="비밀번호" type="password" value={form.password} onChange={handleChange} />
      <br />

      {!sent && <button onClick={sendEmail}>이메일 인증코드 전송</button>}

      {sent && !verified && (
        <div>
          <input name="code" placeholder="인증코드 입력" value={form.code} onChange={handleChange} />
          <button onClick={verifyCode}>인증코드 확인</button>
        </div>
      )}

      {verified && <button onClick={register}>회원가입 완료</button>}

      <p>{message}</p>
    </div>
  );
};

export default SignupWithEmailVerification;
