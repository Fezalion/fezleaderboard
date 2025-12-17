import React from "react";
import { Link } from "react-router-dom";

export default function UnderConstruct() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div
          className="absolute bg-purple-600 opacity-30 rounded-full w-96 h-96 animate-blob1"
          style={{ top: "-8rem", left: "-8rem" }}
        />
        <div
          className="absolute bg-pink-500 opacity-20 rounded-full w-80 h-80 animate-blob2"
          style={{ bottom: "-6rem", right: "-6rem" }}
        />
        <div
          className="absolute bg-blue-500 opacity-20 rounded-full w-72 h-72 animate-blob3"
          style={{ top: "40%", left: "60%" }}
        />
      </div>
      {/* Main content */}
      <div className="z-10 flex flex-col items-center">
        <h1 className="text-6xl font-extrabold mb-4 animate-fadeIn drop-shadow-lg">
          See you next private league!
        </h1>
        <p className="text-xl mb-8 animate-fadeIn delay-200">
          you can access last private league by{" "}
          <Link to="/letmein" className="hover:underline">
            /letmein
          </Link>
        </p>
        <div className="flex gap-4 mt-4 animate-fadeIn delay-400">
          <div className="w-4 h-4 bg-purple-400 rounded-full animate-bounce delay-0" />
          <div className="w-4 h-4 bg-pink-400 rounded-full animate-bounce delay-150" />
          <div className="w-4 h-4 bg-blue-400 rounded-full animate-bounce delay-300" />
        </div>
      </div>
      {/* Animations CSS */}
      <style>{`
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
