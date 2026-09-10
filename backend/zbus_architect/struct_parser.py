"""Lightweight extraction of struct/union definitions from C source."""

from __future__ import annotations

import re

from .model import MessageType


def _extract_braced(text: str, open_idx: int) -> str:
    """Extract the contents of a balanced { ... } starting at `open_idx` (the `{`)."""
    depth = 0
    for i in range(open_idx, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[open_idx : i + 1]
    raise ValueError("Unbalanced braces in struct definition")


def _find_string_end(text: str, start: int) -> int:
    """Return the index just after the closing quote of a C string/char literal."""
    quote = text[start]
    i = start + 1
    while i < len(text):
        ch = text[i]
        if ch == "\\":
            i += 2
            continue
        if ch == quote:
            return i + 1
        i += 1
    raise ValueError("Unterminated string literal")


def _find_struct_definition(text: str, keyword: str, start: int) -> tuple[str, str, int] | None:
    """Find the next `struct <name> { ... };` or `union <name> { ... };`.

    Returns (full_text, name, end_index) or None.
    """
    pattern = re.compile(r"\b(" + keyword + r")\s+([A-Za-z_]\w*)\s*\{", re.DOTALL)
    m = pattern.search(text, start)
    if not m:
        return None

    full_start = m.start()
    name = m.group(2)
    brace_start = m.end() - 1  # index of '{'
    brace = _extract_braced(text, brace_start)
    semi = text.find(";", brace_start + len(brace))
    if semi == -1:
        raise ValueError(f"Missing ';' after {keyword} {name}")
    full_end = semi + 1
    return text[full_start:full_end], name, full_end


def parse_structs(text: str) -> list[MessageType]:
    """Return all top-level struct and union definitions as MessageType objects."""
    messages: list[MessageType] = []
    seen: set[str] = set()
    pos = 0

    # Skip string literals so a '{' inside a string does not confuse the brace
    # counter.  We perform a simple pass that replaces strings with spaces.
    safe = list(text)
    i = 0
    while i < len(safe):
        ch = safe[i]
        if ch in '"\'':
            end = _find_string_end(text, i)
            for j in range(i, end):
                if safe[j] not in "\n":
                    safe[j] = " "
            i = end
        else:
            i += 1
    safe_text = "".join(safe)

    for keyword in ("struct", "union"):
        pos = 0
        while True:
            result = _find_struct_definition(safe_text, keyword, pos)
            if not result:
                break
            definition, name, end = result
            pos = end
            if name in seen:
                continue
            seen.add(name)
            messages.append(MessageType(name=name, definition=definition))

    return messages
