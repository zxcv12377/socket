import Navbar from "./components/ui/Navbar";
import { ChatProvider } from "./context/ChatContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./layouts/Layout";
import axiosInstance from "./lib/axiosInstance";
import SignupWithEmailVerification from "./myTest/components/test/emailtest/SignupWithEmailVerification";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { useUserContext } from "@/context/UserContext";

function App() {
  const [token, setToken] = useState(null);
  const [name, setName] = useState(null);

  const { user, loading } = useUserContext();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedName = localStorage.getItem("name");
    if (savedToken && savedName) {
      setToken(savedToken);
      setName(savedName);
    }
  }, []);

  const handleLogin = (token) => {
    if (token) {
      localStorage.setItem("token", token);
      setToken(token);
      axiosInstance.get("/members/me").then((res) => {
        setName(res.data.name);
        localStorage.setItem("name", res.data.name);
      });
    } else {
      localStorage.clear();
      setToken(null);
      setName(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setName(null);
  };

  function RootLayout({ onLogout }) {
    return (
      <div>
        <Navbar onLogout={onLogout} />
        <div className="pt-16 h-[calc(100vh-4rem)]">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <ChatProvider>
      {/* <div className="bg-red-500 text-white p-4">Hello</div> */}
      {/* <VoiceChannelWithSpeaking /> */}
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootLayout onLogout={handleLogout} />}>
              <Route index element={<Layout />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/register" element={<SignupWithEmailVerification />} />
            </Route>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ChatProvider>
  );
}

export default App;
