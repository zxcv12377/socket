import "./index.css";
// ← 여기!
import App from "./App.jsx";
import React from "react";
import { createRoot } from "react-dom/client";
import { UserProvider } from "./context/UserContext.jsx";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
