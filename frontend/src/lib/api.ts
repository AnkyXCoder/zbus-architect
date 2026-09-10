import axios from "axios";

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
    headers: { "Content-Type": "application/json" },
});

export async function importProject(path: string) {
    const { data } = await API.post("/import/file", { path });
    return data;
}

export async function fetchChecks(path: string) {
    const { data } = await API.post("/checks", { path });
    return data as Array<{
        id: string;
        severity: "error" | "warning" | "info";
        message: string;
        channel: string | null;
        observer: string | null;
        thread: string | null;
    }>;
}

export async function generateFiles(architecture: unknown) {
    const { data } = await API.post("/generate", {
        architecture,
        files: ["zbus_channels.h", "zbus_observers.c"],
    });
    return data;
}

export default API;
