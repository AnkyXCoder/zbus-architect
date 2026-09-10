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

interface ZbusState {
  architecture: unknown | null;
  nodes: ZbusNode[];
  edges: ZbusEdge[];
  setArchitecture: (architecture: unknown) => void;
  setGraph: (nodes: ZbusNode[], edges: ZbusEdge[]) => void;
}

export const useZbusStore = create<ZbusState>((set) => ({
  architecture: null,
  nodes: [],
  edges: [],
  setArchitecture: (architecture) => set({ architecture }),
  setGraph: (nodes, edges) => set({ nodes, edges }),
}));
