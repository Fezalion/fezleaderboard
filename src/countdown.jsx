import React, { useState, useEffect } from "react";
import "./Countdown.css";
import logo from "/return-of-the-ancestorts-logo-en.png";
import timerbg from "/timer-bg.png";

const TimeBox = ({ value, label }) => (
  <div className="time-box">
    <div className="number">{value}</div>
    <div className="label">{label}</div>
  </div>
);

const formatTime = (num) => String(num).padStart(2, "0");

const PoECountdown = () => {
  const targetDate = new Date("July 24, 2026 1:00 PM PDT").getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="overlay-container">
      <div className="header-logo" style={{ textAlign: "center" }}>
        <img src={logo} alt="Curse of the Allflame" width={0} />
        <h2 className="reveal-text">Curse of the Allflame</h2>
        <h2 className="reveal-text">Releases July 24 July 16 (PDT)</h2>
      </div>

      {}
      <div
        className="timer-wrapper"
        style={{ backgroundImage: `url(${timerbg})` }}
      >
        <div className="slot">
          <span className="number">{timeLeft.days}</span>
          <span className="label">Days</span>
        </div>
        <div className="slot">
          <span className="number">{timeLeft.hours}</span>
          <span className="label">Hours</span>
        </div>
        <div className="slot">
          <span className="number">{formatTime(timeLeft.minutes)}</span>
          <span className="label">Minutes</span>
        </div>
        <div className="slot">
          <span className="number">{formatTime(timeLeft.seconds)}</span>
          <span className="label">Seconds</span>
        </div>
      </div>
    </div>
  );
};

export default PoECountdown;
