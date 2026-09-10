"""Static design checks for a zbus architecture."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from .model import Architecture

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


def run_checks(arch: Architecture) -> list[Check]:
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

    return checks
