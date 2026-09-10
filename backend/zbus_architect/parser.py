"""C source parser for ZBUS_* macro invocations.

Lightweight regex/state-machine parser for the v1 proof-of-concept.
It is not a full C preprocessor, but it handles common ZBUS macro shapes
well enough to seed the architecture model.
"""

from __future__ import annotations

import re
from pathlib import Path

from .model import Architecture, Channel, ChannelObservation, Observer, Thread
from .struct_parser import parse_structs

DQ = chr(34)
SQ = chr(39)


def remove_c_comments(text: str) -> str:
    """Strip // and /* */ comments so they don't confuse macro extraction."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    text = re.sub(r"//.*", "", text)
    return text


def _extract_balanced(text: str, start: int) -> str:
    """Extract the contents of a balanced (...) starting at `start` (index of '(')."""
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "(":
            depth += 1
        elif text[i] == ")":
            depth -= 1
            if depth == 0:
                return text[start + 1: i]
    raise ValueError("Unbalanced parentheses in macro call")


def split_arguments(arg_text: str) -> list[str]:
    """Split macro arguments by commas, respecting nested parentheses/braces/brackets."""
    args: list[str] = []
    depth = 0
    current: list[str] = []
    in_string = False
    string_char: str | None = None

    for ch in arg_text:
        if in_string:
            current.append(ch)
            if ch == string_char:
                in_string = False
            continue

        if ch == DQ or ch == SQ:
            in_string = True
            string_char = ch
            current.append(ch)
            continue

        if ch in "([{":
            depth += 1
            current.append(ch)
        elif ch in "]})":
            depth -= 1
            current.append(ch)
        elif ch == "," and depth == 0:
            arg = "".join(current).strip()
            if arg:
                args.append(arg)
            current = []
        else:
            current.append(ch)

    if current:
        arg = "".join(current).strip()
        if arg:
            args.append(arg)
    return args


def find_macro_calls(text: str, macro_name: str) -> list[str]:
    """Return the argument strings for every exact invocation of `macro_name`.

    A negative lookahead prevents matching `ZBUS_CHAN_DEFINE` against
    `ZBUS_CHAN_DEFINE_WITH_ID` or `ZBUS_SHADOW_CHAN_DEFINE`.
    """
    pattern = re.compile(
        r"\b" + re.escape(macro_name) + r"(?![A-Za-z0-9_])\s*\(", re.DOTALL
    )
    matches: list[str] = []
    for m in pattern.finditer(text):
        try:
            arg_text = _extract_balanced(text, m.end() - 1)
            matches.append(arg_text)
        except ValueError:
            continue
    return matches


def _clean_token(t: str) -> str:
    return t.strip().strip("&")


def _parse_observers_arg(arg: str) -> list[str]:
    """Parse ZBUS_OBSERVERS(L1, L2) or ZBUS_OBSERVERS_EMPTY."""
    if arg == "ZBUS_OBSERVERS_EMPTY" or arg == "ZBUS_OBSERVERS()":
        return []
    if arg.startswith("ZBUS_OBSERVERS"):
        inner = find_macro_calls(arg, "ZBUS_OBSERVERS")
        if not inner:
            return []
        return [a.strip() for a in split_arguments(inner[0]) if a.strip()]
    return [a.strip() for a in split_arguments(arg) if a.strip()]


def _parse_initial_value_arg(arg: str) -> str | None:
    return arg.strip() or None


def parse_channel(arg_text: str, with_id: bool = False) -> Channel:
    args = split_arguments(arg_text)
    if with_id:
        if len(args) < 7:
            raise ValueError(
                f"ZBUS_CHAN_DEFINE_WITH_ID needs 7 args, got {len(args)}")
        return Channel(
            name=args[0].strip(),
            message_type=args[2].strip(),
            channel_id=int(args[1].strip()),
            validator=_clean_token(args[3]) if _clean_token(
                args[3]) != "NULL" else None,
            user_data=_clean_token(args[4]) if _clean_token(
                args[4]) != "NULL" else None,
            observers=_parse_observers_arg(args[5]),
            initial_value=_parse_initial_value_arg(args[6]),
        )
    if len(args) < 6:
        raise ValueError(f"ZBUS_CHAN_DEFINE needs 6 args, got {len(args)}")
    return Channel(
        name=args[0].strip(),
        message_type=args[1].strip(),
        validator=_clean_token(args[2]) if _clean_token(
            args[2]) != "NULL" else None,
        user_data=_clean_token(args[3]) if _clean_token(
            args[3]) != "NULL" else None,
        observers=_parse_observers_arg(args[4]),
        initial_value=_parse_initial_value_arg(args[5]),
    )


def parse_listener(arg_text: str) -> Observer:
    args = split_arguments(arg_text)
    if len(args) < 2:
        raise ValueError(f"ZBUS_LISTENER_DEFINE needs 2 args, got {len(args)}")
    return Observer(
        name=args[0].strip(),
        kind="listener",
        callback=args[1].strip().strip("&"),
        enabled=True,
    )


def parse_subscriber(arg_text: str) -> Observer:
    args = split_arguments(arg_text)
    if len(args) < 2:
        raise ValueError(
            f"ZBUS_SUBSCRIBER_DEFINE needs 2 args, got {len(args)}")
    queue_size: int | None = None
    try:
        queue_size = int(args[1].strip())
    except ValueError:
        pass
    return Observer(
        name=args[0].strip(),
        kind="subscriber",
        queue_size=queue_size,
        enabled=True,
    )


def parse_msg_subscriber(arg_text: str) -> Observer:
    args = split_arguments(arg_text)
    if not args:
        raise ValueError("ZBUS_MSG_SUBSCRIBER_DEFINE needs at least 1 arg")
    return Observer(
        name=args[0].strip(),
        kind="msg_subscriber",
        enabled=True,
    )


def parse_async_listener(arg_text: str) -> Observer:
    args = split_arguments(arg_text)
    if len(args) < 2:
        raise ValueError(
            f"ZBUS_ASYNC_LISTENER_DEFINE needs 2 args, got {len(args)}")
    return Observer(
        name=args[0].strip(),
        kind="async_listener",
        callback=args[1].strip().strip("&"),
        enabled=True,
    )


def parse_add_obs(arg_text: str, with_mask: bool = False) -> ChannelObservation:
    args = split_arguments(arg_text)
    if with_mask:
        if len(args) < 4:
            raise ValueError(
                f"ZBUS_CHAN_ADD_OBS_WITH_MASK needs 4 args, got {len(args)}")
        return ChannelObservation(
            channel=args[0].strip().strip("&"),
            observer=args[1].strip().strip("&"),
            masked=args[2].strip().lower() in ("true", "1"),
            priority=args[3].strip().strip(DQ),
        )
    if len(args) < 3:
        raise ValueError(f"ZBUS_CHAN_ADD_OBS needs 3 args, got {len(args)}")
    return ChannelObservation(
        channel=args[0].strip().strip("&"),
        observer=args[1].strip().strip("&"),
        priority=args[2].strip().strip(DQ),
    )


def parse_thread(arg_text: str) -> Thread:
    args = split_arguments(arg_text)
    if len(args) < 9:
        raise ValueError(f"K_THREAD_DEFINE needs 9 args, got {len(args)}")
    return Thread(
        name=args[0].strip(),
        stack_size=args[1].strip(),
        entry=args[2].strip().strip("&"),
        priority=_int_or_none(args[6]),
        options=_int_or_none(args[7]),
        delay=_int_or_none(args[8]),
    )


def _int_or_none(text: str) -> int | None:
    text = text.strip()
    try:
        return int(text)
    except ValueError:
        return None


def parse_source(text: str) -> Architecture:
    text = remove_c_comments(text)
    arch = Architecture()

    for arg_text in find_macro_calls(text, "ZBUS_CHAN_DEFINE"):
        try:
            arch.channels.append(parse_channel(arg_text))
        except ValueError:
            pass

    for arg_text in find_macro_calls(text, "ZBUS_CHAN_DEFINE_WITH_ID"):
        try:
            arch.channels.append(parse_channel(arg_text, with_id=True))
        except ValueError:
            pass

    for arg_text in find_macro_calls(text, "ZBUS_LISTENER_DEFINE"):
        try:
            arch.observers.append(parse_listener(arg_text))
        except ValueError:
            pass

    for arg_text in find_macro_calls(text, "ZBUS_SUBSCRIBER_DEFINE"):
        try:
            arch.observers.append(parse_subscriber(arg_text))
        except ValueError:
            pass

    for arg_text in find_macro_calls(text, "ZBUS_MSG_SUBSCRIBER_DEFINE"):
        try:
            arch.observers.append(parse_msg_subscriber(arg_text))
        except ValueError:
            pass

    for arg_text in find_macro_calls(text, "ZBUS_ASYNC_LISTENER_DEFINE"):
        try:
            arch.observers.append(parse_async_listener(arg_text))
        except ValueError:
            pass

    for arg_text in find_macro_calls(text, "ZBUS_CHAN_ADD_OBS"):
        try:
            arch.add_observations.append(parse_add_obs(arg_text))
        except ValueError:
            pass

    for arg_text in find_macro_calls(text, "ZBUS_CHAN_ADD_OBS_WITH_MASK"):
        try:
            arch.add_observations.append(
                parse_add_obs(arg_text, with_mask=True))
        except ValueError:
            pass

    for arg_text in find_macro_calls(text, "K_THREAD_DEFINE"):
        try:
            arch.threads.append(parse_thread(arg_text))
        except ValueError:
            pass

    arch.messages = parse_structs(text)
    return arch


def parse_file(path: Path | str) -> Architecture:
    text = Path(path).read_text(encoding="utf-8")
    return parse_source(text)
