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
