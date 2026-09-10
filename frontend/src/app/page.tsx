"use client";

import { useState } from "react";

import CheckPanel from "@/components/CheckPanel";
import FlowCanvas from "@/components/FlowCanvas";
import PropertyPanel from "@/components/PropertyPanel";
import Toolbar from "@/components/Toolbar";
import { fetchChecks, generateFiles, importProject, runChecks } from "@/lib/api";
import { useZbusStore } from "@/store/useZbusStore";
import type { Architecture } from "@/lib/types";

function download(name: string, content: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Home() {
    const [path, setPath] = useState("");
    const architecture = useZbusStore((s) => s.architecture);
    const setArchitecture = useZbusStore((s) => s.setArchitecture);
    const setChecks = useZbusStore((s) => s.setChecks);
    const newArchitecture = useZbusStore((s) => s.newArchitecture);
    const selectedNodeId = useZbusStore((s) => s.selectedNodeId);

    const handleImport = async () => {
        try {
            const [arch, checks] = await Promise.all([
                importProject(path),
                fetchChecks(path),
            ]);
            setArchitecture(arch);
            setChecks(checks);
        } catch (err: any) {
            alert(err.message || "Import failed");
        }
    };

    const handleCheck = async () => {
        if (!architecture) {
            alert("Create or import an architecture first");
            return;
        }
        try {
            const checks = await runChecks(architecture);
            setChecks(checks);
        } catch (err: any) {
            alert(err.message || "Check failed");
        }
    };

    const handleExport = async () => {
        if (!architecture) {
            alert("Create or import an architecture first");
            return;
        }
        try {
            const files = await generateFiles(architecture);
            for (const [name, content] of Object.entries(files)) {
                download(name, content as string);
            }
        } catch (err: any) {
            alert(err.message || "Export failed");
        }
    };

    return (
        <main className="flex h-screen flex-col">
            <header className="flex items-center gap-4 border-b border-slate-800 bg-slate-900 p-4">
                <h1 className="text-lg font-semibold">zbus-architect</h1>
                <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="/path/to/fixtures/hello_world.c"
                    className="rounded bg-slate-800 px-2 py-1 text-sm"
                />
                <button
                    onClick={handleImport}
                    className="rounded bg-blue-600 px-3 py-1 text-sm font-medium hover:bg-blue-500"
                >
                    Import
                </button>
                <button
                    onClick={newArchitecture}
                    className="rounded bg-slate-600 px-3 py-1 text-sm font-medium hover:bg-slate-500"
                >
                    New
                </button>
                <button
                    onClick={handleCheck}
                    className="rounded bg-yellow-600 px-3 py-1 text-sm font-medium hover:bg-yellow-500"
                >
                    Check
                </button>
                <button
                    onClick={handleExport}
                    className="rounded bg-green-600 px-3 py-1 text-sm font-medium hover:bg-green-500"
                >
                    Export
                </button>
            </header>
            <section className="flex flex-1 overflow-hidden">
                <Toolbar />
                <div className="flex-1">
                    <FlowCanvas />
                </div>
                <aside className="w-80 border-l border-slate-800 bg-slate-900">
                    {selectedNodeId ? <PropertyPanel /> : <CheckPanel />}
                </aside>
            </section>
        </main>
    );
}
