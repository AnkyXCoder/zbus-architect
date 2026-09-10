import { create } from "zustand";

export interface ZbusNode {
    id: string;
    type: "channel" | "observer" | "thread";
    position: { x: number; y: number };
    data: Record<string, unknown>;
}

export interface ZbusEdge {
    id: string;
    source: string;
    target: string;
}

export interface ZbusCheck {
    id: string;
    severity: "error" | "warning" | "info";
    message: string;
    channel: string | null;
    observer: string | null;
    thread: string | null;
}

interface ZbusState {
    architecture: unknown | null;
    nodes: ZbusNode[];
    edges: ZbusEdge[];
    checks: ZbusCheck[];
    setArchitecture: (architecture: unknown) => void;
    setGraph: (nodes: ZbusNode[], edges: ZbusEdge[]) => void;
    setChecks: (checks: ZbusCheck[]) => void;
}

export const useZbusStore = create<ZbusState>((set) => ({
    architecture: null,
    nodes: [],
    edges: [],
    checks: [],
    setArchitecture: (architecture) => set({ architecture }),
    setGraph: (nodes, edges) => set({ nodes, edges }),
    setChecks: (checks) => set({ checks }),
}));
