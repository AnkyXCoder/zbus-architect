# zbus-architect

A design-first, web-based visual architect for Zephyr's `zbus` message bus.

**Goal:** import existing `ZBUS_*` C sources, edit the channel/observer graph visually, run static design checks, and export production-ready `zbus_channels.h`, `zbus_observers.c`, and `zbus_messages.h`.

## Current features

- **Import parser** — extracts channels, observers, subscribers, async listeners, threads, and `ZBUS_CHAN_ADD_OBS` links from C source.
- **Code generator** — emits `zbus_channels.h` and `zbus_observers.c` using the same macros found in real Zephyr code.
- **Static design checks** — duplicate channels/IDs/observers, unobserved channels, orphan observers.
- **Next.js + React Flow frontend** — import a source file and explore the channel/observer graph in the browser.
- **FastAPI backend** — REST endpoints for `/import/file`, `/import/text`, `/generate`, and `/checks`.
- **CLI** — `zbus-architect import`, `zbus-architect generate`, `zbus-architect check`.
- **Verified build** — `build_test/` imports `samples/subsys/zbus/hello_world` and builds on `native_sim` using `zephyr-mcp-server`.

## Layout

- `backend/` — Python package: parser, model, codegen, checks, CLI, FastAPI server.
- `frontend/` — Next.js + React Flow + Tailwind UI.
- `fixtures/` — sample C files for parser and checks tests.
- `build_test/` — west build test that proves generated zbus code compiles.

## Requirements

- Python 3.10+
- Node.js 18+ and npm
- A west workspace with Zephyr (e.g. the `iNode` workspace in this repo)

## Quick start

```bash
cd /home/ankit/Workspaces/fwProjects/iNode/zbus-architect

# Backend
python -m venv .venv
.venv/bin/pip install -e .[test]

# Parse, check, and export a fixture
PYTHONPATH=backend .venv/bin/python -m zbus_architect.cli import fixtures/hello_world.c --pretty
PYTHONPATH=backend .venv/bin/python -m zbus_architect.cli check fixtures/hello_world.c --pretty
PYTHONPATH=backend .venv/bin/python -m zbus_architect.cli generate fixtures/hello_world.c -d build_test/src

# Run Python tests
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests

# Frontend
cd frontend
npm install
npm run build
npm run dev
```

## West build test

```bash
# The build_test app already contains the generated code and builds on native_sim:
cd /home/ankit/Workspaces/fwProjects/iNode
west build -b native_sim -d build/build_test_native_sim zbus-architect/build_test --pristine
```

Or use the `zephyr-mcp-server` `build` tool with:

- `app_path`: `/home/ankit/Workspaces/fwProjects/iNode/zbus-architect/build_test`
- `board`: `native_sim`

## License

Apache-2.0
