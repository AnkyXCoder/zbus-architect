"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useZbusStore } from "@/store/useZbusStore";
import type {
    Architecture,
    Channel,
    MessageType,
    Observer,
    ProxyAgent,
    Thread,
} from "@/lib/types";

function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            {children}
        </div>
    );
}

function TextInput({
    value,
    onChange,
}: {
    value: string | null | undefined;
    onChange: (value: string) => void;
}) {
    return (
        <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded bg-white px-2 py-1 text-sm text-slate-900 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
        />
    );
}

function NumberInput({
    value,
    onChange,
}: {
    value: number | null | undefined;
    onChange: (value: number | null) => void;
}) {
    return (
        <input
            type="number"
            value={value ?? ""}
            onChange={(e) => {
                const v = e.target.value === "" ? null : Number(e.target.value);
                onChange(v);
            }}
            className="w-full rounded bg-white px-2 py-1 text-sm text-slate-900 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
        />
    );
}

function Checkbox({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="rounded bg-white text-blue-600 ring-1 ring-slate-300 dark:bg-slate-800 dark:ring-slate-700"
            />
            {label}
        </label>
    );
}

function ChannelForm({
    architecture,
    channel,
    update,
}: {
    architecture: Architecture;
    channel: Channel;
    update: (ch: Channel) => void;
}) {
    const [form, setForm] = useState<Channel>(channel);

    useEffect(() => {
        setForm(channel);
    }, [channel]);

    return (
        <div className="p-2 text-slate-900 dark:text-slate-200">
            <h3 className="mb-3 text-sm font-semibold">Channel: {channel.name}</h3>
            <Field label="Message type">
                <select
                    value={form.message_type}
                    onChange={(e) => setForm({ ...form, message_type: e.target.value })}
                    className="w-full rounded bg-white px-2 py-1 text-sm text-slate-900 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                >
                    {architecture.messages.map((m) => (
                        <option key={m.name} value={`struct ${m.name}`}>
                            struct {m.name}
                        </option>
                    ))}
                    <option value={form.message_type}>{form.message_type}</option>
                </select>
            </Field>
            <Field label="Validator function">
                <TextInput
                    value={form.validator}
                    onChange={(v) => setForm({ ...form, validator: v || null })}
                />
            </Field>
            <Field label="User data">
                <TextInput
                    value={form.user_data}
                    onChange={(v) => setForm({ ...form, user_data: v || null })}
                />
            </Field>
            <Field label="Initial value">
                <TextInput
                    value={form.initial_value}
                    onChange={(v) => setForm({ ...form, initial_value: v || null })}
                />
            </Field>
            <Field label="Shadow channel">
                <Checkbox
                    label="Is shadow"
                    checked={form.is_shadow || false}
                    onChange={(v) => setForm({ ...form, is_shadow: v })}
                />
            </Field>
            <Field label="Proxy agent">
                <TextInput
                    value={form.proxy_agent}
                    onChange={(v) => setForm({ ...form, proxy_agent: v || null })}
                />
            </Field>
            <button
                onClick={() => update(form)}
                className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-500"
            >
                Save
            </button>
        </div>
    );
}

function ObserverForm({
    observer,
    update,
}: {
    observer: Observer;
    update: (o: Observer) => void;
}) {
    const [form, setForm] = useState<Observer>(observer);

    useEffect(() => {
        setForm(observer);
    }, [observer]);

    return (
        <div className="p-2 text-slate-900 dark:text-slate-200">
            <h3 className="mb-3 text-sm font-semibold">Observer: {observer.name}</h3>
            <Field label="Kind">
                <select
                    value={form.kind}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            kind: e.target.value as Observer["kind"],
                        })
                    }
                    className="w-full rounded bg-white px-2 py-1 text-sm text-slate-900 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                >
                    <option value="listener">Listener</option>
                    <option value="subscriber">Subscriber</option>
                    <option value="msg_subscriber">Msg Subscriber</option>
                    <option value="async_listener">Async Listener</option>
                </select>
            </Field>
            {form.kind.endsWith("listener") && (
                <Field label="Callback">
                    <TextInput
                        value={form.callback}
                        onChange={(v) => setForm({ ...form, callback: v || null })}
                    />
                </Field>
            )}
            {form.kind === "subscriber" && (
                <Field label="Queue size">
                    <NumberInput
                        value={form.queue_size}
                        onChange={(v) => setForm({ ...form, queue_size: v })}
                    />
                </Field>
            )}
            <Field label="Enabled">
                <Checkbox
                    label="Enabled"
                    checked={form.enabled}
                    onChange={(v) => setForm({ ...form, enabled: v })}
                />
            </Field>
            <button
                onClick={() => update(form)}
                className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-500"
            >
                Save
            </button>
        </div>
    );
}

function ThreadForm({
    thread,
    update,
}: {
    thread: Thread;
    update: (t: Thread) => void;
}) {
    const [form, setForm] = useState<Thread>(thread);

    useEffect(() => {
        setForm(thread);
    }, [thread]);

    return (
        <div className="p-2 text-slate-900 dark:text-slate-200">
            <h3 className="mb-3 text-sm font-semibold">Thread: {thread.name}</h3>
            <Field label="Entry function">
                <TextInput
                    value={form.entry}
                    onChange={(v) => setForm({ ...form, entry: v || null })}
                />
            </Field>
            <Field label="Stack size">
                <NumberInput
                    value={form.stack_size}
                    onChange={(v) => setForm({ ...form, stack_size: v })}
                />
            </Field>
            <Field label="Priority">
                <NumberInput
                    value={form.priority}
                    onChange={(v) => setForm({ ...form, priority: v })}
                />
            </Field>
            <Field label="Options">
                <NumberInput
                    value={form.options}
                    onChange={(v) => setForm({ ...form, options: v })}
                />
            </Field>
            <Field label="Delay">
                <NumberInput
                    value={form.delay}
                    onChange={(v) => setForm({ ...form, delay: v })}
                />
            </Field>
            <button
                onClick={() => update(form)}
                className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-500"
            >
                Save
            </button>
        </div>
    );
}

function MessageForm({
    message,
    update,
}: {
    message: MessageType;
    update: (m: MessageType) => void;
}) {
    const [form, setForm] = useState<MessageType>(message);

    useEffect(() => {
        setForm(message);
    }, [message]);

    return (
        <div className="p-2 text-slate-900 dark:text-slate-200">
            <h3 className="mb-3 text-sm font-semibold">Message: {message.name}</h3>
            <Field label="Definition">
                <textarea
                    value={form.definition || ""}
                    onChange={(e) => setForm({ ...form, definition: e.target.value })}
                    rows={8}
                    className="w-full rounded bg-white px-2 py-1 font-mono text-sm text-slate-900 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                />
            </Field>
            <button
                onClick={() => update(form)}
                className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-500"
            >
                Save
            </button>
        </div>
    );
}

function ProxyForm({
    agent,
    update,
}: {
    agent: ProxyAgent;
    update: (a: ProxyAgent) => void;
}) {
    const [form, setForm] = useState<ProxyAgent>(agent);

    useEffect(() => {
        setForm(agent);
    }, [agent]);

    return (
        <div className="p-2 text-slate-900 dark:text-slate-200">
            <h3 className="mb-3 text-sm font-semibold">Proxy: {agent.name}</h3>
            <Field label="Backend type">
                <TextInput
                    value={form.backend_type}
                    onChange={(v) => setForm({ ...form, backend_type: v })}
                />
            </Field>
            <Field label="Device-tree node">
                <TextInput
                    value={form.backend_dt_node}
                    onChange={(v) => setForm({ ...form, backend_dt_node: v })}
                />
            </Field>
            <button
                onClick={() => update(form)}
                className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-500"
            >
                Save
            </button>
        </div>
    );
}

export default function PropertyPanel() {
    const selectedNodeId = useZbusStore((s) => s.selectedNodeId);
    const architecture = useZbusStore((s) => s.architecture);
    const updateChannel = useZbusStore((s) => s.updateChannel);
    const updateObserver = useZbusStore((s) => s.updateObserver);
    const updateThread = useZbusStore((s) => s.updateThread);
    const updateMessage = useZbusStore((s) => s.updateMessage);
    const updateProxyAgent = useZbusStore((s) => s.updateProxyAgent);
    const removeNode = useZbusStore((s) => s.removeNode);

    if (!selectedNodeId || !architecture) {
        return null;
    }

    const [prefix, ...rest] = selectedNodeId.split("-");
    const name = rest.join("-");

    return (
        <div className="h-full overflow-auto border-l border-slate-300 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
            {prefix === "ch" && (
                <ChannelForm
                    architecture={architecture}
                    channel={architecture.channels.find((c) => c.name === name)!}
                    update={(ch) => updateChannel(name, ch)}
                />
            )}
            {prefix === "obs" && (
                <ObserverForm
                    observer={architecture.observers.find((o) => o.name === name)!}
                    update={(o) => updateObserver(name, o)}
                />
            )}
            {prefix === "thr" && (
                <ThreadForm
                    thread={architecture.threads.find((t) => t.name === name)!}
                    update={(t) => updateThread(name, t)}
                />
            )}
            {prefix === "msg" && (
                <MessageForm
                    message={architecture.messages.find((m) => m.name === name)!}
                    update={(m) => updateMessage(name, m)}
                />
            )}
            {prefix === "prx" && (
                <ProxyForm
                    agent={architecture.proxy_agents.find((a) => a.name === name)!}
                    update={(a) => updateProxyAgent(name, a)}
                />
            )}
            <div className="px-2 pb-2">
                <button
                    onClick={() => removeNode(selectedNodeId)}
                    className="w-full rounded bg-red-700 px-2 py-1 text-sm font-medium text-white hover:bg-red-600"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
