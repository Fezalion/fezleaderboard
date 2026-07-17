import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import UnderConstruct from "./UnderConstruct.jsx";
import MusicPlayer from "./player.jsx";
import PoECountdown from "./countdown.jsx";
import Overlays from "./Overlays";
import OverlayView from "./OverlayView";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/fezleaderboard">
      <Routes>
        <Route path="/letmein" element={<App />} />
        <Route path="/" element={<UnderConstruct />} />
        <Route path="/music" element={<MusicPlayer />} />
        <Route path="/countdown" element={<PoECountdown />} />
        <Route path="/overlays" element={<Overlays />} />
        <Route path="/overlay" element={<OverlayView />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
