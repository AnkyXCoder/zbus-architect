"use client";

import { useEffect, useState } from "react";

import CheckPanel from "@/components/CheckPanel";
import FlowCanvas from "@/components/FlowCanvas";
import PropertyPanel from "@/components/PropertyPanel";
import Toolbar from "@/components/Toolbar";
import TutorialPanel from "@/components/TutorialPanel";
import { fetchChecks, generateFiles, importProject, runChecks } from "@/lib/api";
import { useZbusStore } from "@/store/useZbusStore";

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
    const [showTutorial, setShowTutorial] = useState(false);
    const [paneWidth, setPaneWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const architecture = useZbusStore((s) => s.architecture);
    const setArchitecture = useZbusStore((s) => s.setArchitecture);
    const setChecks = useZbusStore((s) => s.setChecks);
    const newArchitecture = useZbusStore((s) => s.newArchitecture);
    const clearAll = useZbusStore((s) => s.clearAll);
    const selectedNodeId = useZbusStore((s) => s.selectedNodeId);
    const history = useZbusStore((s) => s.history);
    const future = useZbusStore((s) => s.future);
    const undo = useZbusStore((s) => s.undo);
    const redo = useZbusStore((s) => s.redo);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                e.preventDefault();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
                redo();
                e.preventDefault();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [undo, redo]);

    useEffect(() => {
        if (!isResizing) return;
        const onMove = (e: MouseEvent) => {
            const next = window.innerWidth - e.clientX;
            setPaneWidth(Math.min(600, Math.max(240, next)));
        };
        const onUp = () => setIsResizing(false);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [isResizing]);

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
            <header className="flex items-center gap-4 border-b border-slate-300 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900">
                <h1 className="text-lg font-semibold">zbus-architect</h1>
                <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="/path/to/fixtures/hello_world.c"
                    className="rounded bg-white px-2 py-1 text-sm text-slate-900 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                />
                <button
                    onClick={handleImport}
                    className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-500"
                >
                    Import
                </button>
                <button
                    onClick={newArchitecture}
                    className="rounded bg-slate-500 px-3 py-1 text-sm font-medium text-white hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                    New
                </button>
                <button
                    onClick={clearAll}
                    className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-500"
                >
                    Clear
                </button>
                <button
                    onClick={handleCheck}
                    className="rounded bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600"
                >
                    Check
                </button>
                <button
                    onClick={handleExport}
                    className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-500"
                >
                    Export
                </button>
                <button
                    onClick={undo}
                    disabled={!history.length}
                    className="rounded bg-slate-500 px-3 py-1 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-40 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                    Undo
                </button>
                <button
                    onClick={redo}
                    disabled={!future.length}
                    className="rounded bg-slate-500 px-3 py-1 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-40 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                    Redo
                </button>
                <button
                    onClick={() => setShowTutorial(true)}
                    className="ml-auto rounded bg-cyan-600 px-3 py-1 text-sm font-medium text-white hover:bg-cyan-500"
                >
                    Tutorial
                </button>
            </header>
            <section className="flex flex-1 overflow-hidden">
                <Toolbar />
                <div className="flex-1">
                    <FlowCanvas />
                </div>
                <div
                    onMouseDown={() => setIsResizing(true)}
                    className="w-1 cursor-col-resize bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
                />
                <aside
                    style={{ width: paneWidth }}
                    className="border-l border-slate-300 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                >
                    {selectedNodeId ? <PropertyPanel /> : <CheckPanel />}
                </aside>
            </section>
            {showTutorial && <TutorialPanel onClose={() => setShowTutorial(false)} />}
        </main>
    );
}
