"""Command-line interface for zbus-architect."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import click

from .checks import run_checks
from .codegen import (
    generate_zbus_channels_h,
    generate_zbus_messages_h,
    generate_zbus_observers_c,
)
from .parser import parse_file, parse_source


@click.group()
def main() -> None:
    pass


@main.command()
@click.argument("path", type=click.Path(exists=True, path_type=Path))
@click.option("--output", "-o", type=click.Path(path_type=Path), default=None)
@click.option("--pretty", is_flag=True)
def import_(path: Path, output: Path | None, pretty: bool) -> None:
    if path.is_dir():
        # For a directory, concatenate all .c and .h files.
        text = ""
        for child in sorted(path.rglob("*")):
            if child.suffix in (".c", ".h"):
                text += child.read_text(encoding="utf-8") + "\n"
        arch = parse_source(text)
    else:
        arch = parse_file(path)

    data = arch.model_dump()
    json_text = json.dumps(data, indent=2 if pretty else None, default=str)
    if output:
        output.write_text(json_text)
    else:
        click.echo(json_text)


@main.command()
@click.argument("path", type=click.Path(exists=True, dir_okay=False, path_type=Path))
@click.option("--out-dir", "-d", type=click.Path(file_okay=False, path_type=Path), default=Path("."))
def generate(path: Path, out_dir: Path) -> None:
    arch = parse_file(path)
    (out_dir / "zbus_messages.h").write_text(generate_zbus_messages_h(arch))
    (out_dir / "zbus_channels.h").write_text(generate_zbus_channels_h(arch))
    (out_dir / "zbus_observers.c").write_text(generate_zbus_observers_c(arch))
    click.echo(f"Generated in {out_dir}")


@main.command()
@click.argument("path", type=click.Path(exists=True, dir_okay=False, path_type=Path))
@click.option("--pretty", is_flag=True)
def check(path: Path, pretty: bool) -> None:
    arch = parse_file(path)
    results = run_checks(arch)
    data = [c.model_dump() for c in results]
    click.echo(json.dumps(data, indent=2 if pretty else None))


if __name__ == "__main__":
    main()
