"""FastAPI server for the zbus-architect backend."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .checks import Check, run_checks
from .codegen import (
    generate_zbus_channels_h,
    generate_zbus_messages_h,
    generate_zbus_observers_c,
)
from .model import Architecture
from .parser import parse_file, parse_source

app = FastAPI(title="zbus-architect backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ImportPath(BaseModel):
    path: str


class ImportText(BaseModel):
    source: str


class GeneratePayload(BaseModel):
    architecture: Architecture
    files: list[str] | None = None


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/import/file")
def import_file(payload: ImportPath) -> Architecture:
    return parse_file(payload.path)


@app.post("/import/text")
def import_text(payload: ImportText) -> Architecture:
    return parse_source(payload.source)


@app.post("/generate")
def generate(payload: GeneratePayload) -> dict:
    wanted = set(payload.files or [
                 "zbus_messages.h", "zbus_channels.h", "zbus_observers.c"])
    result: dict = {}
    if "zbus_messages.h" in wanted:
        result["zbus_messages.h"] = generate_zbus_messages_h(
            payload.architecture)
    if "zbus_channels.h" in wanted:
        result["zbus_channels.h"] = generate_zbus_channels_h(
            payload.architecture)
    if "zbus_observers.c" in wanted:
        result["zbus_observers.c"] = generate_zbus_observers_c(
            payload.architecture)
    return result


@app.post("/checks")
def checks(payload: ImportPath) -> list[Check]:
    source = Path(payload.path).read_text(encoding="utf-8")
    arch = parse_source(source)
    return run_checks(arch, source)


@app.post("/checks/architecture")
def checks_architecture(payload: Architecture) -> list[Check]:
    return run_checks(payload)
