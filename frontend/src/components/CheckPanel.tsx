"use client";

import { useZbusStore } from "@/store/useZbusStore";

const SEVERITY_STYLES: Record<string, string> = {
    error: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
    warning: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100",
    info: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
};

export default function CheckPanel() {
    const checks = useZbusStore((s) => s.checks);
    if (!checks.length) {
        return (
            <p className="p-2 text-sm text-slate-600 dark:text-slate-400">No issues found.</p>
        );
    }
    return (
        <div className="h-full overflow-auto p-2">
            {checks.map((c, i) => (
                <div
                    key={i}
                    className={`mb-2 rounded p-2 text-sm ${SEVERITY_STYLES[c.severity] || "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100"}`}
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
