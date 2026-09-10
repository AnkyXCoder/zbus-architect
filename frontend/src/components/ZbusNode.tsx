"use client";

import { Handle, Position } from "@xyflow/react";

import { useZbusStore } from "@/store/useZbusStore";

const NODE_STYLES: Record<string, string> = {
    channel: "bg-blue-600 border-blue-700",
    observer: "bg-green-600 border-green-700",
    thread: "bg-orange-600 border-orange-700",
    message: "bg-slate-600 border-slate-700",
    proxy: "bg-cyan-600 border-cyan-700",
};

function hasSource(type: string) {
    return type === "channel" || type === "proxy";
}

function hasTarget(type: string) {
    return type === "channel" || type === "observer";
}

export default function ZbusNode({ type, data, selected }: any) {
    const connectMode = useZbusStore((s) => s.connectMode);
    const base = NODE_STYLES[type] || "bg-slate-600 border-slate-700";
    const selectedRing = selected ? "ring-2 ring-white" : "";
    const showSource = connectMode && hasSource(type);
    const showTarget = connectMode && hasTarget(type);

    return (
        <div className={`relative rounded border-2 px-3 py-2 text-sm text-white shadow ${base} ${selectedRing}`}>
            {showTarget && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!bg-white !border-slate-600"
                />
            )}
            <div className="font-medium">{data.label}</div>
            {type === "observer" && data.kind && (
                <div className="text-xs opacity-80">{data.kind}</div>
            )}
            {type === "channel" && data.message_type && (
                <div className="text-xs opacity-80">{data.message_type}</div>
            )}
            {type === "thread" && data.entry && (
                <div className="text-xs opacity-80">{data.entry}</div>
            )}
            {type === "proxy" && data.backend_type && (
                <div className="text-xs opacity-80">{data.backend_type}</div>
            )}
            {type === "message" && data.definition && (
                <div className="text-xs opacity-80 line-clamp-2">{data.definition}</div>
            )}
            {showSource && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!bg-white !border-slate-600"
                />
            )}
        </div>
    );
}
