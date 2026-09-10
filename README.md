# zbus-architect

A design-first, web-based visual architect for Zephyr's `zbus` message bus.

**Goal:** import existing `ZBUS_*` C sources, edit the channel/observer graph visually, run static design checks, and export production-ready `zbus_channels.h`, `zbus_observers.c`, and `zbus_messages.h`.

## Current features

- **Import parser** — extracts channels, observers, subscribers, async listeners, threads, and `ZBUS_CHAN_ADD_OBS` links from C source.
- **Code generator** — emits `zbus_channels.h` and `zbus_observers.c` using the same macros found in real Zephyr code.
- **Static design checks** — duplicate channels/IDs/observers, unobserved channels, orphan observers, message-flow cycles.
- **More macro coverage** — `_WITH_ENABLE` observer variants, shadow channels, proxy agents, and proxy channel links.
- **Next.js + React Flow frontend** — drag and drop zbus components, connect them, edit properties, run checks, and export generated code.
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

## Installation

```bash
cd /home/ankit/Workspaces/fwProjects/iNode/zbus-architect

# Python backend
python3.14 -m venv .venv
.venv/bin/pip install -e .[test]

# Next.js frontend
cd frontend
npm ci
```

## Quick start

### CLI

```bash
cd /home/ankit/Workspaces/fwProjects/iNode/zbus-architect

# Parse an existing zbus source file
PYTHONPATH=backend .venv/bin/python -m zbus_architect.cli import fixtures/hello_world.c --pretty

# Run design checks
PYTHONPATH=backend .venv/bin/python -m zbus_architect.cli check fixtures/hello_world.c --pretty

# Generate C files
PYTHONPATH=backend .venv/bin/python -m zbus_architect.cli generate fixtures/hello_world.c -d build_test/src

# Run the test suite
PYTHONPATH=backend .venv/bin/python -m pytest backend/tests
```

### Webpage

1. Start the backend API server:

```bash
cd /home/ankit/Workspaces/fwProjects/iNode/zbus-architect
.venv/bin/uvicorn zbus_architect.server:app --reload
```

2. In another terminal, start the frontend:

```bash
cd /home/ankit/Workspaces/fwProjects/iNode/zbus-architect/frontend
npm run dev
```

3. Open `http://localhost:3000` in your browser.

4. Enter an absolute C source path (for example `/home/ankit/Workspaces/fwProjects/iNode/os/zephyr/samples/subsys/zbus/hello_world/src/main.c`) and click **Import**.

5. Use the page:
   - Drag components from the **Toolbar** onto the canvas.
   - Click a node to edit its properties in the right panel.
   - Drag from the right side of a channel to the left side of an observer to connect them.
   - Click **Check** to validate the model.
   - Click **Export** to download `zbus_messages.h`, `zbus_channels.h`, and `zbus_observers.c`.

   You can also click **New** to start a blank design, then add channels, observers, threads, message types, and proxy agents.

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
