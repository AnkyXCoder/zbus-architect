"use client";

import {
    EdgeLabelRenderer,
    getBezierPath,
} from "@xyflow/react";

export default function AnimatedEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}: any) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const markerId = `${id}-arrow`;

    return (
        <>
            <defs>
                <marker
                    id={markerId}
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="5"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L10,5 L0,10 z" fill="#0ea5e9" />
                </marker>
            </defs>
            <path
                id={id}
                className="react-flow__edge-path"
                d={edgePath}
                stroke="#0ea5e9"
                strokeWidth={3}
                fill="none"
                strokeDasharray="5 5"
                markerEnd={`url(#${markerId})`}
            />
            <circle r="4" fill="#0ea5e9">
                <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
            </circle>
            {data?.label && (
                <EdgeLabelRenderer>
                    <div
                        className="absolute rounded bg-slate-900 px-2 py-1 text-xs text-white shadow"
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        }}
                    >
                        {data.label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
