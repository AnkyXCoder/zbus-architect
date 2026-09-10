"use client";

import { DragEvent, useCallback, useEffect } from "react";
import {
    Background,
    Connection,
    Controls,
    MarkerType,
    Panel,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type ColorMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useZbusStore } from "@/store/useZbusStore";
import ZbusNode from "@/components/ZbusNode";

const nodeTypes = {
    channel: ZbusNode,
    observer: ZbusNode,
    thread: ZbusNode,
    message: ZbusNode,
    proxy: ZbusNode,
};

const NODE_STYLE = {
    minWidth: 140,
    fontSize: 13,
};

function Legend() {
    return (
        <Panel
            position="top-left"
            className="rounded border border-slate-300 bg-white/90 p-3 text-xs text-slate-700 shadow dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300"
        >
            <div className="mb-2 font-semibold">Legend</div>
            <div className="space-y-1">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-blue-600" /> Channel</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-green-600" /> Listener / Subscriber</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-yellow-600" /> Msg Subscriber</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-pink-600" /> Async Listener</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-orange-600" /> Thread</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-slate-600" /> Message Type</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-cyan-600" /> Proxy Agent</div>
                <div className="flex items-center gap-2"><span className="h-px w-6 bg-slate-500" /> Direct link</div>
                <div className="flex items-center gap-2"><span className="h-px w-6 border-t border-dashed border-slate-500" /> Runtime observation</div>
                <div className="flex items-center gap-2"><span className="h-px w-6 border-t border-dotted border-slate-500" /> Proxy → shadow</div>
            </div>
        </Panel>
    );
}

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
    const updateChannel = useZbusStore((s) => s.updateChannel);
    const setConnectMode = useZbusStore((s) => s.setConnectMode);

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

        const CHANNEL_X = 80;
        const OBSERVER_X = 400;
        const THREAD_X = 720;
        const PROXY_X = 400;
        const MESSAGE_X = 80;
        const SECONDARY_Y = 680;
        const Y_STEP = 130;

        (arch.channels || []).forEach((ch: any, idx: number) => {
            newNodes.push({
                id: `ch-${ch.name}`,
                type: "channel",
                position: makePos(`ch-${ch.name}`, { x: CHANNEL_X, y: idx * Y_STEP }),
                data: { label: ch.name, ...ch },
                style: NODE_STYLE,
            });
        });

        (arch.observers || []).forEach((obs: any, idx: number) => {
            newNodes.push({
                id: `obs-${obs.name}`,
                type: "observer",
                position: makePos(`obs-${obs.name}`, { x: OBSERVER_X, y: idx * Y_STEP }),
                data: { label: obs.name, ...obs },
                style: NODE_STYLE,
            });
        });

        (arch.threads || []).forEach((th: any, idx: number) => {
            newNodes.push({
                id: `thr-${th.name}`,
                type: "thread",
                position: makePos(`thr-${th.name}`, { x: THREAD_X, y: idx * Y_STEP }),
                data: { label: th.name, ...th },
                style: NODE_STYLE,
            });
        });

        (arch.messages || []).forEach((m: any, idx: number) => {
            newNodes.push({
                id: `msg-${m.name}`,
                type: "message",
                position: makePos(`msg-${m.name}`, { x: MESSAGE_X, y: SECONDARY_Y + idx * Y_STEP }),
                data: { label: m.name, ...m },
                style: NODE_STYLE,
            });
        });

        (arch.proxy_agents || []).forEach((a: any, idx: number) => {
            newNodes.push({
                id: `prx-${a.name}`,
                type: "proxy",
                position: makePos(`prx-${a.name}`, { x: PROXY_X, y: SECONDARY_Y + idx * Y_STEP }),
                data: { label: a.name, ...a },
                style: NODE_STYLE,
            });
        });

        const newEdges: any[] = [];
        const edgeIds = new Set<string>();
        const channelMap = Object.fromEntries(
            (arch.channels || []).map((c: any) => [c.name, c])
        );

        const pushEdge = (
            id: string,
            source: string,
            target: string,
            opts: {
                animated?: boolean;
                dashed?: boolean;
                label?: string;
            } = {}
        ) => {
            if (edgeIds.has(id)) return;
            edgeIds.add(id);
            newEdges.push({
                id,
                source,
                target,
                type: "smoothstep",
                label: opts.label,
                animated: !!opts.animated,
                markerEnd: { type: MarkerType.ArrowClosed },
                style: {
                    strokeWidth: opts.animated ? 3 : 2,
                    strokeDasharray: opts.dashed ? "5 5" : undefined,
                    stroke: opts.animated ? "#0ea5e9" : undefined,
                },
            });
        };

        (arch.channels || []).forEach((ch: any) => {
            (ch.observers || []).forEach((obsName: string) => {
                const simulating = simulatingChannels.has(ch.name);
                pushEdge(
                    `${ch.name}-${obsName}`,
                    `ch-${ch.name}`,
                    `obs-${obsName}`,
                    {
                        animated: simulating,
                        label: simulating ? `data: ${ch.message_type}` : undefined,
                    }
                );
            });
        });

        (arch.add_observations || []).forEach((obs: any) => {
            const ch = channelMap[obs.channel];
            const simulating = simulatingChannels.has(obs.channel);
            pushEdge(
                `add-${obs.channel}-${obs.observer}`,
                `ch-${obs.channel}`,
                `obs-${obs.observer}`,
                {
                    animated: simulating,
                    dashed: true,
                    label: simulating
                        ? `data: ${ch?.message_type || "?"} (runtime)`
                        : undefined,
                }
            );
        });

        (arch.channels || []).forEach((ch: any) => {
            if (ch.proxy_agent) {
                const simulating =
                    simulatingChannels.has(ch.name) || simulatingChannels.has(ch.proxy_agent);
                pushEdge(
                    `proxy-${ch.proxy_agent}-${ch.name}`,
                    `prx-${ch.proxy_agent}`,
                    `ch-${ch.name}`,
                    {
                        animated: simulating,
                        dashed: true,
                        label: simulating
                            ? `data: ${ch.message_type} (shadow)`
                            : undefined,
                    }
                );
            }
        });

        setNodes(newNodes);
        setEdges(newEdges);
    }, [architecture, simulatingChannels, setNodes, setEdges]);

    const onConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return;

            if (connection.source.startsWith("ch-") && connection.target.startsWith("obs-")) {
                const chName = connection.source.slice(3);
                const obsName = connection.target.slice(4);
                addObservation(chName, obsName);
            } else if (connection.source.startsWith("prx-") && connection.target.startsWith("ch-")) {
                const proxyName = connection.source.slice(4);
                const chName = connection.target.slice(3);
                const arch = architecture as any;
                const ch = arch?.channels?.find((c: any) => c.name === chName);
                if (ch) {
                    updateChannel(chName, { ...ch, proxy_agent: proxyName });
                }
            }

            setConnectMode(false);
        },
        [addObservation, architecture, setConnectMode, updateChannel]
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
                nodeTypes={nodeTypes}
                colorMode={"system" as ColorMode}
                fitView
            >
                <Background />
                <Controls />
                <Legend />
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
