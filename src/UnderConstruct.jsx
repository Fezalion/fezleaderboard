import React from "react";
import { Link } from "react-router-dom";

export default function UnderConstruct() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-[#e8e6f0] relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(139,92,246,0.16) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 100%, rgba(255,140,66,0.10) 0%, transparent 60%), #08090c",
      }}
    >
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div
          className="absolute bg-[#8b5cf6] opacity-25 rounded-full w-96 h-96 animate-blob1 blur-xl"
          style={{ top: "-8rem", left: "-8rem" }}
        />
        <div
          className="absolute bg-[#ff8c42] opacity-15 rounded-full w-80 h-80 animate-blob2 blur-xl"
          style={{ bottom: "-6rem", right: "-6rem" }}
        />
        <div
          className="absolute bg-[#4ecdc4] opacity-15 rounded-full w-72 h-72 animate-blob3 blur-xl"
          style={{ top: "40%", left: "60%" }}
        />
      </div>
      {/* Main content */}
      <div className="z-10 flex flex-col items-center px-6 text-center">
        <h1
          className="text-6xl mb-4 animate-fadeIn drop-shadow-lg"
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            background:
              "linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 45%, #ff8c42 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          See you next private league!
        </h1>
        <p className="text-xl mb-8 animate-fadeIn delay-200 text-[#a8a5b8]">
          you can access last private league by{" "}
          <Link
            to="/letmein"
            className="text-[#ff8c42] hover:text-[#ffab6b] hover:underline"
          >
            /letmein
          </Link>
        </p>
        <div className="flex gap-4 mt-4 animate-fadeIn delay-400">
          <div className="w-4 h-4 bg-[#8b5cf6] rounded-full animate-bounce delay-0" />
          <div className="w-4 h-4 bg-[#ff8c42] rounded-full animate-bounce delay-150" />
          <div className="w-4 h-4 bg-[#4ecdc4] rounded-full animate-bounce delay-300" />
        </div>
      </div>
      {/* Animations CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap');
        @keyframes blob1 {
          0%, 100% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.1) translate(30px, -20px); }
          66% { transform: scale(0.95) translate(-20px, 20px); }
        }
        @keyframes blob2 {
          0%, 100% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.05) translate(-20px, 30px); }
          66% { transform: scale(0.9) translate(20px, -10px); }
        }
        @keyframes blob3 {
          0%, 100% { transform: scale(1) translate(0, 0); }
          33% { transform: scale(1.08) translate(-10px, 20px); }
          66% { transform: scale(0.92) translate(10px, -20px); }
        }
        .animate-blob1 { animation: blob1 12s infinite ease-in-out; }
        .animate-blob2 { animation: blob2 14s infinite ease-in-out; }
        .animate-blob3 { animation: blob3 16s infinite ease-in-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 1.2s cubic-bezier(0.4,0,0.2,1) both; }
        .animate-fadeIn.delay-200 { animation-delay: 0.2s; }
        .animate-fadeIn.delay-400 { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        .animate-bounce { animation: bounce 1.2s infinite cubic-bezier(0.4,0,0.2,1); }
        .animate-bounce.delay-0 { animation-delay: 0s; }
        .animate-bounce.delay-150 { animation-delay: 0.15s; }
        .animate-bounce.delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
}
