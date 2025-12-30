"use client";

import { useEffect } from "react";

export default function LoginSuccessPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const customerId = params.get("customerId");
    const sessionId = params.get("state"); // This is the sessionId we passed as 'state'

    if (token) {
      // 1. Reliable Path: Save to Redis via API
      if (sessionId) {
        fetch("/api/auth/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, token, customerId }),
        }).catch((err) => console.error("Failed to save token to Redis:", err));
      }

      // Close this popup window
      setTimeout(() => {
        window.close();
      }, 1000); // Slightly longer delay to ensure the fetch has time to start
    }
  }, []);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-5 gap-16">
      <main className="flex flex-col gap-8 row-start-2 items-center text-center max-w-xl">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Login Successful!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          You have been successfully authenticated. This window will close automatically.
        </p>
      </main>
    </div>
  );
}

