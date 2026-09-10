"use client";

import { useZbusStore } from "@/store/useZbusStore";

const SEVERITY_STYLES: Record<string, string> = {
  error: "bg-red-900 text-red-100",
  warning: "bg-yellow-900 text-yellow-100",
  info: "bg-blue-900 text-blue-100",
};

export default function CheckPanel() {
  const checks = useZbusStore((s) => s.checks);
  if (!checks.length) {
    return (
      <p className="text-slate-400 text-sm p-2">No issues found.</p>
    );
  }
  return (
    <div className="h-full overflow-auto p-2">
      {checks.map((c, i) => (
        <div
          key={i}
          className={`mb-2 rounded p-2 text-sm ${SEVERITY_STYLES[c.severity] || "bg-slate-800"}`}
        >
          <div className="font-medium">{c.id}</div>
          <div>{c.message}</div>
          {c.channel && (
            <div className="text-xs opacity-80">channel: {c.channel}</div>
          )}
          {c.observer && (
            <div className="text-xs opacity-80">observer: {c.observer}</div>
          )}
        </div>
      ))}
    </div>
  );
}
