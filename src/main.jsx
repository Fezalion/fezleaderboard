import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import UnderConstruct from "./UnderConstruct.jsx";
import ImpendingDoomCalc from "./impending-doom-calc.jsx";
import MusicPlayer from "./player.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/fezleaderboard">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/secret" element={<UnderConstruct />} />
        <Route path="/music" element={<MusicPlayer />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
