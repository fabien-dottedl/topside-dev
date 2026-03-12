import { useState, useEffect } from "react";

export function Header({ connected }: { connected: boolean }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
      <h1 className="text-xl font-bold tracking-tight">Topside</h1>
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span
          className={`flex items-center gap-1.5 ${connected ? "text-emerald-400" : "text-red-400"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`}
          />
          {connected ? "Live" : "Disconnected"}
        </span>
        <time>{time.toLocaleTimeString()}</time>
      </div>
    </header>
  );
}
