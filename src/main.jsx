import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import UnderConstruct from "./UnderConstruct.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/fezleaderboard">
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dev" element={<UnderConstruct />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
