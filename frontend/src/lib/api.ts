import axios from "axios";

import type { Architecture, ZbusCheck } from "@/lib/types";

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
    headers: { "Content-Type": "application/json" },
});

export async function importProject(path: string): Promise<Architecture> {
    const { data } = await API.post("/import/file", { path });
    return data as Architecture;
}

export async function importText(source: string): Promise<Architecture> {
    const { data } = await API.post("/import/text", { source });
    return data as Architecture;
}

export async function fetchChecks(path: string): Promise<ZbusCheck[]> {
    const { data } = await API.post("/checks", { path });
    return data as ZbusCheck[];
}

export async function runChecks(architecture: Architecture): Promise<ZbusCheck[]> {
    const { data } = await API.post("/checks/architecture", architecture);
    return data as ZbusCheck[];
}

export async function generateFiles(
    architecture: Architecture,
    files = ["zbus_messages.h", "zbus_channels.h", "zbus_observers.c"]
): Promise<Record<string, string>> {
    const { data } = await API.post("/generate", { architecture, files });
    return data as Record<string, string>;
}

export default API;
