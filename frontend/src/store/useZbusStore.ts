import { create } from "zustand";

import type {
    Architecture,
    Channel,
    MessageType,
    Observer,
    ProxyAgent,
    Thread,
    ZbusCheck,
} from "@/lib/types";

export interface ZbusNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
}

export interface ZbusEdge {
    id: string;
    source: string;
    target: string;
}

interface ZbusState {
    architecture: Architecture | null;
    checks: ZbusCheck[];
    selectedNodeId: string | null;
    simulatingChannels: Set<string>;
    connectMode: boolean;
    setArchitecture: (architecture: Architecture) => void;
    newArchitecture: () => void;
    clearAll: () => void;
    setChecks: (checks: ZbusCheck[]) => void;
    setSelectedNodeId: (id: string | null) => void;
    simulatePublish: (channelName: string) => void;
    clearSimulation: () => void;
    setConnectMode: (value: boolean) => void;

    addChannel: (channel: Channel) => void;
    addObserver: (observer: Observer) => void;
    addThread: (thread: Thread) => void;
    addMessage: (message: MessageType) => void;
    addProxyAgent: (agent: ProxyAgent) => void;

    updateChannel: (name: string, channel: Channel) => void;
    updateObserver: (name: string, observer: Observer) => void;
    updateThread: (name: string, thread: Thread) => void;
    updateMessage: (name: string, message: MessageType) => void;
    updateProxyAgent: (name: string, agent: ProxyAgent) => void;

    addObservation: (channel: string, observer: string) => void;
    removeObservation: (channel: string, observer: string) => void;

    removeNode: (id: string) => void;
    updateNodePosition: (id: string, position: { x: number; y: number }) => void;
}

function emptyArchitecture(): Architecture {
    return {
        channels: [],
        observers: [],
        threads: [],
        proxy_agents: [],
        add_observations: [],
        messages: [],
    };
}

export const useZbusStore = create<ZbusState>((set) => ({
    architecture: null,
    checks: [],
    selectedNodeId: null,
    simulatingChannels: new Set(),
    connectMode: false,

    setArchitecture: (architecture) => set({ architecture }),
    newArchitecture: () => set({ architecture: emptyArchitecture(), selectedNodeId: null }),
    clearAll: () => set({ architecture: null, checks: [], selectedNodeId: null, simulatingChannels: new Set() }),
    setChecks: (checks) => set({ checks }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setConnectMode: (value) => set({ connectMode: value }),
    simulatePublish: (channelName) => {
        set((s) => ({ simulatingChannels: new Set(s.simulatingChannels).add(channelName) }));
        setTimeout(() => {
            set((s) => {
                const next = new Set(s.simulatingChannels);
                next.delete(channelName);
                return { simulatingChannels: next };
            });
        }, 1500);
    },
    clearSimulation: () => set({ simulatingChannels: new Set() }),

    addChannel: (channel) =>
        set((s) => ({
            architecture: s.architecture
                ? { ...s.architecture, channels: [...s.architecture.channels, channel] }
                : s.architecture,
        })),

    addObserver: (observer) =>
        set((s) => ({
            architecture: s.architecture
                ? { ...s.architecture, observers: [...s.architecture.observers, observer] }
                : s.architecture,
        })),

    addThread: (thread) =>
        set((s) => ({
            architecture: s.architecture
                ? { ...s.architecture, threads: [...s.architecture.threads, thread] }
                : s.architecture,
        })),

    addMessage: (message) =>
        set((s) => ({
            architecture: s.architecture
                ? { ...s.architecture, messages: [...s.architecture.messages, message] }
                : s.architecture,
        })),

    addProxyAgent: (agent) =>
        set((s) => ({
            architecture: s.architecture
                ? { ...s.architecture, proxy_agents: [...s.architecture.proxy_agents, agent] }
                : s.architecture,
        })),

    updateChannel: (name, channel) =>
        set((s) => ({
            architecture: s.architecture
                ? {
                    ...s.architecture,
                    channels: s.architecture.channels.map((c) =>
                        c.name === name ? channel : c
                    ),
                }
                : s.architecture,
        })),

    updateObserver: (name, observer) =>
        set((s) => ({
            architecture: s.architecture
                ? {
                    ...s.architecture,
                    observers: s.architecture.observers.map((o) =>
                        o.name === name ? observer : o
                    ),
                }
                : s.architecture,
        })),

    updateThread: (name, thread) =>
        set((s) => ({
            architecture: s.architecture
                ? {
                    ...s.architecture,
                    threads: s.architecture.threads.map((t) =>
                        t.name === name ? thread : t
                    ),
                }
                : s.architecture,
        })),

    updateMessage: (name, message) =>
        set((s) => ({
            architecture: s.architecture
                ? {
                    ...s.architecture,
                    messages: s.architecture.messages.map((m) =>
                        m.name === name ? message : m
                    ),
                }
                : s.architecture,
        })),

    updateProxyAgent: (name, agent) =>
        set((s) => ({
            architecture: s.architecture
                ? {
                    ...s.architecture,
                    proxy_agents: s.architecture.proxy_agents.map((a) =>
                        a.name === name ? agent : a
                    ),
                }
                : s.architecture,
        })),

    addObservation: (channel, observer) =>
        set((s) => {
            if (!s.architecture) return s;
            const chan = s.architecture.channels.find((c) => c.name === channel);
            if (!chan) return s;
            const already = chan.observers.includes(observer);
            if (already) return s;
            const nextChannels = s.architecture.channels.map((c) =>
                c.name === channel ? { ...c, observers: [...c.observers, observer] } : c
            );
            return { architecture: { ...s.architecture, channels: nextChannels } };
        }),

    removeObservation: (channel, observer) =>
        set((s) => {
            if (!s.architecture) return s;
            const nextChannels = s.architecture.channels.map((c) =>
                c.name === channel
                    ? { ...c, observers: c.observers.filter((o) => o !== observer) }
                    : c
            );
            return { architecture: { ...s.architecture, channels: nextChannels } };
        }),

    removeNode: (id) =>
        set((s) => {
            if (!s.architecture) return s;
            const [kind, name] = id.split("-");
            const next = { ...s.architecture };
            if (kind === "ch") {
                next.channels = next.channels.filter((c) => c.name !== name);
            } else if (kind === "obs") {
                next.observers = next.observers.filter((o) => o.name !== name);
                next.channels = next.channels.map((c) => ({
                    ...c,
                    observers: c.observers.filter((o) => o !== name),
                }));
            } else if (kind === "thr") {
                next.threads = next.threads.filter((t) => t.name !== name);
            } else if (kind === "msg") {
                next.messages = next.messages.filter((m) => m.name !== name);
            } else if (kind === "prx") {
                next.proxy_agents = next.proxy_agents.filter((a) => a.name !== name);
            }
            return { architecture: next, selectedNodeId: null };
        }),

    updateNodePosition: (id, position) =>
        set((s) => ({ ...s })),
}));
