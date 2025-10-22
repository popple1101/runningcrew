import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // 전역 흰 배경 고정
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
