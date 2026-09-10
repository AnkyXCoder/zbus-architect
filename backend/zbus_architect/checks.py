"""Static design checks for a zbus architecture."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel

from .model import Architecture, Channel
from .parser import remove_c_comments
from .struct_parser import _extract_braced

Severity = Literal["error", "warning", "info"]


class Check(BaseModel):
    id: str
    severity: Severity
    message: str
    channel: str | None = None
    observer: str | None = None
    thread: str | None = None


def _observed_channels(arch: Architecture) -> set[str]:
    names: set[str] = set()
    for ch in arch.channels:
        if ch.observers:
            names.add(ch.name)
    for obs in arch.add_observations:
        names.add(obs.channel)
    return names


def _referenced_observers(arch: Architecture) -> set[str]:
    names: set[str] = set()
    for ch in arch.channels:
        for obs in ch.observers:
            names.add(obs)
    for obs in arch.add_observations:
        names.add(obs.observer)
    return names


def _extract_function_bodies(source: str) -> dict[str, str]:
    text = remove_c_comments(source)
    pattern = re.compile(
        r"^\s*(?:static\s+)?(?:void|int|bool|size_t|uint\d+_t)\s+(\w+)\s*\([^)]*\)\s*\{",
        re.MULTILINE,
    )
    bodies: dict[str, str] = {}
    for m in pattern.finditer(text):
        name = m.group(1)
        open_idx = m.end() - 1
        try:
            body = _extract_braced(text, open_idx)
        except ValueError:
            continue
        bodies[name] = body
    return bodies


def _find_publishes(body: str) -> list[str]:
    targets: list[str] = []
    for pattern in (
        r"\bzbus_chan_pub\s*\(\s*&?(\w+)",
        r"\bzbus_chan_notify\s*\(\s*&?(\w+)",
    ):
        for m in re.finditer(pattern, body):
            targets.append(m.group(1))
    return targets


def _channel_to_targets(
    arch: Architecture, bodies: dict[str, str]
) -> dict[str, list[str]]:
    observer_callbacks = {
        o.name: o.callback for o in arch.observers if o.callback}
    obs_by_channel: dict[str, list[str]] = {}
    for ch in arch.channels:
        obs_by_channel.setdefault(ch.name, []).extend(ch.observers)
    for obs in arch.add_observations:
        obs_by_channel.setdefault(obs.channel, []).append(obs.observer)

    graph: dict[str, list[str]] = {}
    for ch in arch.channels:
        targets: set[str] = set()
        for obs_name in obs_by_channel.get(ch.name, []):
            cb = observer_callbacks.get(obs_name)
            if cb and cb in bodies:
                targets.update(_find_publishes(bodies[cb]))
        if targets:
            graph[ch.name] = sorted(targets)
    return graph


def _find_cycle_from(
    start: str, graph: dict[str, list[str]]
) -> list[str] | None:
    stack = [start]
    seen: set[str] = {start}
    while stack:
        node = stack[-1]
        for nxt in graph.get(node, []):
            if nxt == start:
                return stack + [nxt]
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
                break
        else:
            stack.pop()
    return None


def detect_cycles(arch: Architecture, source: str) -> list[Check]:
    if not arch.channels or not source.strip():
        return []
    bodies = _extract_function_bodies(source)
    graph = _channel_to_targets(arch, bodies)
    checks: list[Check] = []
    for ch in arch.channels:
        if ch.name not in graph:
            continue
        cycle = _find_cycle_from(ch.name, graph)
        if cycle:
            checks.append(
                Check(
                    id="cycle-detected",
                    severity="error",
                    message=f"Cycle in message flow: {' -> '.join(cycle)}",
                    channel=ch.name,
                )
            )
    return checks


def run_checks(arch: Architecture, source: str = "") -> list[Check]:
    checks: list[Check] = []
    channel_names: dict[str, int] = {}
    channel_ids: dict[int, list[str]] = {}
    observer_names: dict[str, int] = {}

    for ch in arch.channels:
        channel_names[ch.name] = channel_names.get(ch.name, 0) + 1
        if ch.channel_id is not None:
            channel_ids.setdefault(ch.channel_id, []).append(ch.name)
    for obs in arch.observers:
        observer_names[obs.name] = observer_names.get(obs.name, 0) + 1

    # Duplicate channel names
    for name, count in channel_names.items():
        if count > 1:
            checks.append(
                Check(
                    id="duplicate-channel-name",
                    severity="error",
                    message=f"Channel {name!r} is defined {count} times.",
                    channel=name,
                )
            )

    # Duplicate channel IDs
    for id_, names in channel_ids.items():
        if len(names) > 1:
            checks.append(
                Check(
                    id="duplicate-channel-id",
                    severity="error",
                    message=f"Channels {names!r} share the same ID {id_}.",
                )
            )

    # Duplicate observer names
    for name, count in observer_names.items():
        if count > 1:
            checks.append(
                Check(
                    id="duplicate-observer-name",
                    severity="error",
                    message=f"Observer {name!r} is defined {count} times.",
                    observer=name,
                )
            )

    # Unobserved channels
    for ch in arch.channels:
        if not ch.observers and not any(
            obs.channel == ch.name for obs in arch.add_observations
        ):
            checks.append(
                Check(
                    id="unobserved-channel",
                    severity="warning",
                    message=f"Channel {ch.name!r} has no observers.",
                    channel=ch.name,
                )
            )

    # Orphan observers
    referenced = _referenced_observers(arch)
    for obs in arch.observers:
        if obs.name not in referenced:
            checks.append(
                Check(
                    id="orphan-observer",
                    severity="warning",
                    message=f"Observer {obs.name!r} is not attached to any channel.",
                    observer=obs.name,
                )
            )

    # Threads that do not seem to host a subscriber
    observer_entries = set()
    for obs in arch.observers:
        if obs.callback:
            observer_entries.add(obs.callback)
    thread_names = {t.name for t in arch.threads}
    for th in arch.threads:
        if th.entry not in observer_entries and th.name not in thread_names:
            checks.append(
                Check(
                    id="thread-without-observer",
                    severity="info",
                    message=f"Thread {th.name!r} does not appear to host a known observer.",
                    thread=th.name,
                )
            )

    # Message type validation
    builtins = {
        "int", "bool", "char", "float", "double", "long", "short",
        "size_t", "uint8_t", "uint16_t", "uint32_t", "uint64_t",
        "int8_t", "int16_t", "int32_t", "int64_t",
    }
    message_names = {m.name for m in arch.messages}
    for ch in arch.channels:
        mt = (ch.message_type or "").strip()
        if mt.startswith("struct "):
            name = mt.split(None, 1)[1].strip()
            if name not in message_names:
                checks.append(
                    Check(
                        id="unknown-message-type",
                        severity="error",
                        message=f"Channel {ch.name!r} references unknown message type {name!r}.",
                        channel=ch.name,
                    )
                )
        elif mt not in builtins:
            checks.append(
                Check(
                    id="unknown-message-type",
                    severity="warning",
                    message=f"Channel {ch.name!r} uses an unrecognised message type {mt!r}.",
                    channel=ch.name,
                )
            )

    if source:
        checks.extend(detect_cycles(arch, source))

    return checks
