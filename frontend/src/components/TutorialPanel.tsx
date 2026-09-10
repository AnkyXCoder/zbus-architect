"use client";

import { HELLO_WORLD_EXAMPLE, TUTORIAL_STEPS } from "@/lib/example";
import { importText, runChecks } from "@/lib/api";
import { useZbusStore } from "@/store/useZbusStore";

export default function TutorialPanel({ onClose }: { onClose: () => void }) {
    const setArchitecture = useZbusStore((s) => s.setArchitecture);
    const setChecks = useZbusStore((s) => s.setChecks);

    const loadExample = async () => {
        try {
            const arch = await importText(HELLO_WORLD_EXAMPLE);
            const checks = await runChecks(arch);
            setArchitecture(arch);
            setChecks(checks);
            onClose();
        } catch (err: any) {
            alert(err.message || "Failed to load example");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg border border-slate-300 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Quick tutorial
                </h2>
                <ol className="mb-6 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-300">
                    {TUTORIAL_STEPS.map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ol>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                    >
                        Close
                    </button>
                    <button
                        onClick={loadExample}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                    >
                        Load example
                    </button>
                </div>
            </div>
        </div>
    );
}
