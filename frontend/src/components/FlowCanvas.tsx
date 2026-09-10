"use client";

import { useEffect } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useZbusStore } from "@/store/useZbusStore";

export default function FlowCanvas() {
  const architecture = useZbusStore((s) => s.architecture);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const arch = architecture as any;
    if (!arch) return;

    const newNodes: any[] = [];
    let y = 0;
    (arch.channels || []).forEach((ch: any, idx: number) => {
      newNodes.push({
        id: `ch-${ch.name}`,
        type: "channel",
        position: { x: 100, y: y + idx * 120 },
        data: { label: ch.name, ...ch },
      });
    });
    (arch.observers || []).forEach((obs: any, idx: number) => {
      newNodes.push({
        id: `obs-${obs.name}`,
        type: "observer",
        position: { x: 500, y: y + idx * 120 },
        data: { label: obs.name, ...obs },
      });
    });

    const newEdges: any[] = [];
    (arch.channels || []).forEach((ch: any) => {
      (ch.observers || []).forEach((obsName: string) => {
        newEdges.push({
          id: `${ch.name}-${obsName}`,
          source: `ch-${ch.name}`,
          target: `obs-${obsName}`,
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [architecture, setNodes, setEdges]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
