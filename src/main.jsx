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
        <Route path="/dev" element={<App />} />
        <Route path="/" element={<UnderConstruct />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
