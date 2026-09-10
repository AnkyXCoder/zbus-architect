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
    history: Architecture[];
    future: Architecture[];
    setArchitecture: (architecture: Architecture) => void;
    newArchitecture: () => void;
    clearAll: () => void;
    setChecks: (checks: ZbusCheck[]) => void;
    setSelectedNodeId: (id: string | null) => void;
    simulatePublish: (channelName: string) => void;
    clearSimulation: () => void;
    setConnectMode: (value: boolean) => void;
    undo: () => void;
    redo: () => void;

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

const HISTORY_LIMIT = 50;

export const useZbusStore = create<ZbusState>((set, get) => {
    const mutate = (fn: (arch: Architecture) => Architecture) =>
        set((s) => {
            if (!s.architecture) return s;
            const next = fn(s.architecture);
            return {
                architecture: next,
                history: [...s.history.slice(-(HISTORY_LIMIT - 1)), s.architecture],
                future: [],
            };
        });

    return {
        architecture: null,
        checks: [],
        selectedNodeId: null,
        simulatingChannels: new Set(),
        connectMode: false,
        history: [],
        future: [],

        setArchitecture: (architecture) =>
            set({ architecture, history: [], future: [], selectedNodeId: null }),
        newArchitecture: () =>
            set({ architecture: emptyArchitecture(), history: [], future: [], selectedNodeId: null }),
        clearAll: () =>
            set({ architecture: null, checks: [], selectedNodeId: null, simulatingChannels: new Set(), history: [], future: [] }),
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

        undo: () => {
            const { architecture, history, future } = get();
            if (!history.length || !architecture) return;
            const prev = history[history.length - 1];
            set({
                architecture: prev,
                history: history.slice(0, -1),
                future: [architecture, ...future].slice(0, HISTORY_LIMIT),
                selectedNodeId: null,
            });
        },

        redo: () => {
            const { architecture, history, future } = get();
            if (!future.length || !architecture) return;
            const next = future[0];
            set({
                architecture: next,
                history: [...history.slice(-(HISTORY_LIMIT - 1)), architecture],
                future: future.slice(1),
                selectedNodeId: null,
            });
        },

        addChannel: (channel) =>
            mutate((arch) => ({ ...arch, channels: [...arch.channels, channel] })),

        addObserver: (observer) =>
            mutate((arch) => ({ ...arch, observers: [...arch.observers, observer] })),

        addThread: (thread) =>
            mutate((arch) => ({ ...arch, threads: [...arch.threads, thread] })),

        addMessage: (message) =>
            mutate((arch) => ({ ...arch, messages: [...arch.messages, message] })),

        addProxyAgent: (agent) =>
            mutate((arch) => ({ ...arch, proxy_agents: [...arch.proxy_agents, agent] })),

        updateChannel: (name, channel) =>
            mutate((arch) => ({
                ...arch,
                channels: arch.channels.map((c) => (c.name === name ? channel : c)),
            })),

        updateObserver: (name, observer) =>
            mutate((arch) => ({
                ...arch,
                observers: arch.observers.map((o) => (o.name === name ? observer : o)),
            })),

        updateThread: (name, thread) =>
            mutate((arch) => ({
                ...arch,
                threads: arch.threads.map((t) => (t.name === name ? thread : t)),
            })),

        updateMessage: (name, message) =>
            mutate((arch) => ({
                ...arch,
                messages: arch.messages.map((m) => (m.name === name ? message : m)),
            })),

        updateProxyAgent: (name, agent) =>
            mutate((arch) => ({
                ...arch,
                proxy_agents: arch.proxy_agents.map((a) => (a.name === name ? agent : a)),
            })),

        addObservation: (channel, observer) =>
            mutate((arch) => {
                const ch = arch.channels.find((c) => c.name === channel);
                if (!ch || ch.observers.includes(observer)) return arch;
                return {
                    ...arch,
                    channels: arch.channels.map((c) =>
                        c.name === channel ? { ...c, observers: [...c.observers, observer] } : c
                    ),
                };
            }),

        removeObservation: (channel, observer) =>
            mutate((arch) => ({
                ...arch,
                channels: arch.channels.map((c) =>
                    c.name === channel
                        ? { ...c, observers: c.observers.filter((o) => o !== observer) }
                        : c
                ),
            })),

        removeNode: (id) =>
            mutate((arch) => {
                const [kind, ...rest] = id.split("-");
                const name = rest.join("-");
                const next = { ...arch };
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
                return next;
            }),

        updateNodePosition: () => undefined,
    };
});
