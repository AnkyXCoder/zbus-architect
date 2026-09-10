# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - current

### Added

- Initial project skeleton with Python backend and Next.js + React Flow frontend.
- `ZBUS_*` macro parser supporting:
  - `ZBUS_CHAN_DEFINE`
  - `ZBUS_CHAN_DEFINE_WITH_ID`
  - `ZBUS_LISTENER_DEFINE`
  - `ZBUS_SUBSCRIBER_DEFINE`
  - `ZBUS_MSG_SUBSCRIBER_DEFINE`
  - `ZBUS_ASYNC_LISTENER_DEFINE`
  - `ZBUS_CHAN_ADD_OBS`
  - `ZBUS_CHAN_ADD_OBS_WITH_MASK`
  - `K_THREAD_DEFINE`
- Pydantic `Architecture` model for channels, observers, threads, and runtime observations.
- Jinja2-based code generation for `zbus_channels.h` and `zbus_observers.c`.
- FastAPI backend with `/import/file`, `/import/text`, `/generate`, and `/checks` endpoints.
- CLI commands: `import`, `generate`, `check`.
- Next.js frontend with an import path input and a React Flow canvas for the channel/observer graph.
- `build_test/` app that imports `os/zephyr/samples/subsys/zbus/hello_world` and builds on `native_sim` using `zephyr-mcp-server`.
- Static design checks: duplicate channel names, duplicate channel IDs, duplicate observer names, unobserved channels, orphan observers.
- Unit tests for parser and checks.
- Drag-and-drop visual editor with a component palette and property panel.
- System-aware light/dark theme and full component names in the sidebar.
- In-app tutorial with a loadable example and a Clear button to reset the canvas.
- Rich tutorial architecture using all zbus macro combinations (listeners, subscribers, async listeners, message subscribers, threads, proxy agents, shadow channels, and runtime observations).
- Visual data-flow simulation: click "Simulate publish" on a channel to animate arrows to its observers.
- Custom node types with color coding, subtitles, and correct connectable handles (message-type nodes have no handles).
- Legend panel on the canvas explaining node and edge types.
- Message-type labels on edges during publish simulation.
- Single `npm run dev` command to start both backend and frontend with `concurrently`.
- Model-driven `/checks/architecture` endpoint for validating a hand-edited architecture.
- C struct/union extraction for message payload definitions.
- `zbus_messages.h` generation.
- Parse `_WITH_ENABLE` observer variants, `ZBUS_SHADOW_CHAN_DEFINE`, `ZBUS_PROXY_AGENT_DEFINE`, and `ZBUS_PROXY_ADD_CHAN`.
- Message-flow cycle detection from `zbus_chan_pub` / `zbus_chan_notify` call graph.
- GitHub Actions CI workflow for backend tests and frontend build.
