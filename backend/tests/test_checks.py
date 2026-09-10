from pathlib import Path

from zbus_architect.checks import Check, run_checks
from zbus_architect.model import Architecture
from zbus_architect.parser import parse_file


def test_hello_world_checks():
    here = Path(__file__).resolve().parent
    fixture = here.parent.parent / "fixtures" / "hello_world.c"
    arch = parse_file(fixture)
    results = run_checks(arch)

    ids = [c.id for c in results]
    assert "unobserved-channel" in ids
    assert results[ids.index("unobserved-channel")].channel == "status_chan"
    assert "duplicate-channel-name" not in ids
    assert "duplicate-observer-name" not in ids
    assert "orphan-observer" not in ids
