"use client";

import { DragEvent, useCallback, useEffect } from "react";
import {
    Background,
    Connection,
    Controls,
    MarkerType,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type ColorMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useZbusStore } from "@/store/useZbusStore";

const NODE_STYLE = {
    minWidth: 120,
    padding: 8,
    fontSize: 13,
};

function CanvasInner() {
    const architecture = useZbusStore((s) => s.architecture);
    const simulatingChannels = useZbusStore((s) => s.simulatingChannels);
    const addChannel = useZbusStore((s) => s.addChannel);
    const addObserver = useZbusStore((s) => s.addObserver);
    const addThread = useZbusStore((s) => s.addThread);
    const addMessage = useZbusStore((s) => s.addMessage);
    const addProxyAgent = useZbusStore((s) => s.addProxyAgent);
    const addObservation = useZbusStore((s) => s.addObservation);
    const setSelectedNodeId = useZbusStore((s) => s.setSelectedNodeId);

    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
    const { screenToFlowPosition } = useReactFlow();

    useEffect(() => {
        const arch = architecture as any;
        if (!arch) {
            setNodes([]);
            setEdges([]);
            return;
        }

        const positions: Record<string, { x: number; y: number }> = {};
        for (const n of nodes) {
            positions[n.id] = n.position;
        }

        const newNodes: any[] = [];
        const makePos = (id: string, fallback: { x: number; y: number }) =>
            positions[id] || fallback;

        (arch.channels || []).forEach((ch: any, idx: number) => {
            newNodes.push({
                id: `ch-${ch.name}`,
                type: "channel",
                position: makePos(`ch-${ch.name}`, { x: 100, y: idx * 140 }),
                data: { label: ch.name, ...ch },
                style: NODE_STYLE,
            });
        });

        (arch.observers || []).forEach((obs: any, idx: number) => {
            newNodes.push({
                id: `obs-${obs.name}`,
                type: "observer",
                position: makePos(`obs-${obs.name}`, { x: 500, y: idx * 140 }),
                data: { label: obs.name, ...obs },
                style: NODE_STYLE,
            });
        });

        (arch.threads || []).forEach((th: any, idx: number) => {
            newNodes.push({
                id: `thr-${th.name}`,
                type: "thread",
                position: makePos(`thr-${th.name}`, { x: 900, y: idx * 140 }),
                data: { label: th.name, ...th },
                style: NODE_STYLE,
            });
        });

        (arch.messages || []).forEach((m: any, idx: number) => {
            newNodes.push({
                id: `msg-${m.name}`,
                type: "message",
                position: makePos(`msg-${m.name}`, { x: 100, y: 400 + idx * 140 }),
                data: { label: m.name, ...m },
                style: NODE_STYLE,
            });
        });

        (arch.proxy_agents || []).forEach((a: any, idx: number) => {
            newNodes.push({
                id: `prx-${a.name}`,
                type: "proxy",
                position: makePos(`prx-${a.name}`, { x: 500, y: 400 + idx * 140 }),
                data: { label: a.name, ...a },
                style: NODE_STYLE,
            });
        });

        const newEdges: any[] = [];
        const edgeIds = new Set<string>();

        const addEdge = (id: string, source: string, target: string, style?: any, label?: string) => {
            if (edgeIds.has(id)) return;
            edgeIds.add(id);
            newEdges.push({
                id,
                source,
                target,
                label,
                animated: simulatingChannels.has(source.replace("ch-", "")) || simulatingChannels.has(source.replace("prx-", "")),
                markerEnd: { type: MarkerType.Arrow },
                style: { strokeWidth: 2, ...style },
            });
        };

        (arch.channels || []).forEach((ch: any) => {
            (ch.observers || []).forEach((obsName: string) => {
                addEdge(`${ch.name}-${obsName}`, `ch-${ch.name}`, `obs-${obsName}`);
            });
        });

        (arch.add_observations || []).forEach((obs: any) => {
            const targetId = `obs-${obs.observer}`;
            addEdge(`add-${obs.channel}-${obs.observer}`, `ch-${obs.channel}`, targetId, { strokeDasharray: "5 5" });
        });

        (arch.channels || []).forEach((ch: any) => {
            if (ch.proxy_agent) {
                addEdge(`proxy-${ch.proxy_agent}-${ch.name}`, `prx-${ch.proxy_agent}`, `ch-${ch.name}`, { strokeDasharray: "2 2" }, "shadow");
            }
        });

        setNodes(newNodes);
        setEdges(newEdges);
    }, [architecture, simulatingChannels, setNodes, setEdges]);

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return;
            if (!connection.source.startsWith("ch-")) return;
            const chName = connection.source.slice(3);
            const obsName = connection.target.startsWith("obs-")
                ? connection.target.slice(4)
                : connection.target;
            addObservation(chName, obsName);
        },
        [addObservation]
    );

    const onNodeClick = useCallback(
        (_event: any, node: any) => {
            setSelectedNodeId(node.id);
        },
        [setSelectedNodeId]
    );

    const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
        (event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            const raw = event.dataTransfer.getData("application/zbus");
            if (!raw) return;
            let tool: any;
            try {
                tool = JSON.parse(raw);
            } catch {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const arch = architecture as any;
            const counts = {
                channel: arch?.channels?.length || 0,
                observer: arch?.observers?.length || 0,
                thread: arch?.threads?.length || 0,
                message: arch?.messages?.length || 0,
                proxy: arch?.proxy_agents?.length || 0,
            };

            if (tool.type === "channel") {
                const idx = counts.channel + 1;
                addChannel({
                    name: `channel_${idx}`,
                    message_type: `struct message_${idx}`,
                    observers: [],
                    initial_value: "ZBUS_MSG_INIT(0)",
                });
            } else if (tool.type === "observer") {
                const idx = counts.observer + 1;
                const kind = tool.kind || "listener";
                addObserver({
                    name: `${kind}_${idx}`,
                    kind,
                    callback: kind.endsWith("listener") ? `cb_${idx}` : null,
                    queue_size: kind === "subscriber" ? 1 : null,
                    enabled: true,
                });
            } else if (tool.type === "thread") {
                const idx = counts.thread + 1;
                addThread({
                    name: `thread_${idx}`,
                    entry: `thread_entry_${idx}`,
                    stack_size: 1024,
                    priority: 5,
                });
            } else if (tool.type === "message") {
                const idx = counts.message + 1;
                addMessage({
                    name: `message_${idx}`,
                    definition: `struct message_${idx} {\n    int value;\n};`,
                });
            } else if (tool.type === "proxy") {
                const idx = counts.proxy + 1;
                addProxyAgent({
                    name: `proxy_${idx}`,
                    backend_type: "ZBUS_PROXY_AGENT_BACKEND_IPC",
                    backend_dt_node: "DT_CHOSEN(zbus_proxy)",
                });
            }

            void position;
        },
        [addChannel, addObserver, addThread, addMessage, addProxyAgent, architecture, screenToFlowPosition]
    );

    return (
        <div
            className="h-full w-full"
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                colorMode={"system" as ColorMode}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}

export default function FlowCanvas() {
    return (
        <ReactFlowProvider>
            <CanvasInner />
        </ReactFlowProvider>
    );
}
