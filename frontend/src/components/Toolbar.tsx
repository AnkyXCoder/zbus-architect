"use client";

import { DragEvent } from "react";

import { useZbusStore } from "@/store/useZbusStore";

const TOOLS = [
    { type: "channel", kind: "", label: "Channel", color: "bg-blue-600" },
    { type: "observer", kind: "listener", label: "Listener", color: "bg-green-600" },
    { type: "observer", kind: "subscriber", label: "Subscriber", color: "bg-yellow-600" },
    { type: "observer", kind: "msg_subscriber", label: "Msg Subscriber", color: "bg-purple-600" },
    { type: "observer", kind: "async_listener", label: "Async Listener", color: "bg-pink-600" },
    { type: "thread", kind: "", label: "Thread", color: "bg-orange-600" },
    { type: "message", kind: "", label: "Message Type", color: "bg-slate-600" },
    { type: "proxy", kind: "", label: "Proxy Agent", color: "bg-cyan-600" },
];

export default function Toolbar() {
    const connectMode = useZbusStore((s) => s.connectMode);
    const setConnectMode = useZbusStore((s) => s.setConnectMode);

    const onDragStart = (event: DragEvent<HTMLDivElement>, tool: (typeof TOOLS)[0]) => {
        event.dataTransfer.setData("application/zbus", JSON.stringify(tool));
        event.dataTransfer.effectAllowed = "move";
    };

    return (
        <div className="flex w-28 flex-col gap-2 border-r border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-2">
            <button
                onClick={() => setConnectMode(!connectMode)}
                className={`rounded p-2 text-center text-xs font-medium text-white ${connectMode ? "bg-emerald-600 hover:bg-emerald-500" : "bg-slate-500 hover:bg-slate-600"
                    }`}
                title={connectMode ? "Click to stop connecting" : "Click to start connecting nodes"}
            >
                {connectMode ? "Connecting…" : "Connect"}
            </button>
            {TOOLS.map((tool) => (
                <div
                    key={tool.label}
                    draggable
                    onDragStart={(e) => onDragStart(e, tool)}
                    className={`cursor-grab rounded p-2 text-center text-xs font-medium leading-tight text-white ${tool.color} hover:opacity-90 active:cursor-grabbing`}
                    title={tool.label}
                >
                    {tool.label}
                </div>
            ))}
        </div>
    );
}
