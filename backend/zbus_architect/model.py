from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class MessageField(BaseModel):
    """A single field inside a message struct."""

    name: str
    type: str
    array_size: Optional[int] = None
    optional: bool = False


class MessageType(BaseModel):
    """A message type (struct or union) used by a channel."""

    name: str
    definition: Optional[str] = None
    fields: list[MessageField] = Field(default_factory=list)
    size: Optional[int] = None
    alignment: Optional[int] = None


class Observer(BaseModel):
    """A zbus observer: listener, subscriber, message subscriber, or async listener."""

    name: str
    kind: str  # listener, subscriber, msg_subscriber, async_listener
    callback: Optional[str] = None
    queue_size: Optional[int] = None
    work_queue: Optional[str] = None
    enabled: bool = True
    priority: Optional[int] = None


class Thread(BaseModel):
    """A statically defined Zephyr thread that may host a subscriber."""

    name: str
    entry: Optional[str] = None
    stack_size: Optional[int] = None
    priority: Optional[int] = None
    options: Optional[int] = None
    delay: Optional[int] = None


class ProxyAgent(BaseModel):
    """A zbus proxy agent with a backend type and a list of forwarded channels."""

    name: str
    backend_type: str
    backend_dt_node: str
    channels: list[str] = Field(default_factory=list)


class ChannelObservation(BaseModel):
    """A channel -> observer link with notification sequence priority."""

    channel: str
    observer: str
    priority: Optional[str] = None
    masked: bool = False


class Channel(BaseModel):
    """A zbus channel definition."""

    name: str
    message_type: str
    channel_id: Optional[int] = None
    validator: Optional[str] = None
    user_data: Optional[str] = None
    observers: list[str] = Field(default_factory=list)
    initial_value: Optional[str] = None
    is_shadow: bool = False
    proxy_agent: Optional[str] = None


class Architecture(BaseModel):
    """The complete zbus architecture model."""

    channels: list[Channel] = Field(default_factory=list)
    observers: list[Observer] = Field(default_factory=list)
    threads: list[Thread] = Field(default_factory=list)
    proxy_agents: list[ProxyAgent] = Field(default_factory=list)
    add_observations: list[ChannelObservation] = Field(default_factory=list)
    messages: list[MessageType] = Field(default_factory=list)

    def by_channel_name(self) -> dict[str, Channel]:
        return {c.name: c for c in self.channels}

    def by_observer_name(self) -> dict[str, Observer]:
        return {o.name: o for o in self.observers}

    def resolve_observations(self) -> list[ChannelObservation]:
        """Return all observations, including the per-channel observer lists."""
        obs: list[ChannelObservation] = []
        for ch in self.channels:
            for obs_name in ch.observers:
                obs.append(ChannelObservation(
                    channel=ch.name, observer=obs_name))
        obs.extend(self.add_observations)
        return obs
