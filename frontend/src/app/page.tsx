"use client";

import { useState } from "react";

import FlowCanvas from "@/components/FlowCanvas";
import { importProject } from "@/lib/api";
import { useZbusStore } from "@/store/useZbusStore";

export default function Home() {
  const [path, setPath] = useState("");
  const setArchitecture = useZbusStore((s) => s.setArchitecture);

  const handleImport = async () => {
    try {
      const arch = await importProject(path);
      setArchitecture(arch);
    } catch (err: any) {
      alert(err.message || "Import failed");
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
      </header>
      <section className="flex-1">
        <FlowCanvas />
      </section>
    </main>
  );
}
