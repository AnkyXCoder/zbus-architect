# zbus-architect

A design-first, web-based visual architect for Zephyr's `zbus` message bus.

**Goal:** import existing `ZBUS_*` C sources, edit the channel/observer graph visually, run static design checks, and export production-ready `zbus_channels.h`, `zbus_observers.c`, and `zbus_messages.h`.

## Layout

- `backend/` — Python import parser, code generator, and FastAPI server.
- `frontend/` — Next.js + React Flow UI.
- `fixtures/` — sample C files for parser tests.

## Quick start

```bash
# Backend
cd /home/ankit/Workspaces/fwProjects/zbus-architect
python -m venv .venv
source .venv/bin/activate
pip install -e .
python -m zbus_architect.cli import fixtures/hello_world.c

# Frontend
cd frontend
npm install
npm run dev
```

## License

Apache-2.0
