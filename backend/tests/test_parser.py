from pathlib import Path

from zbus_architect.model import Architecture
from zbus_architect.parser import parse_file


def test_parse_hello_world():
    here = Path(__file__).resolve().parent
    fixture = here.parent.parent / "fixtures" / "hello_world.c"
    arch = parse_file(fixture)

    assert isinstance(arch, Architecture)
    assert len(arch.channels) == 2
    assert arch.channels[0].name == "acc_chan"
    assert arch.channels[0].message_type == "struct acc_msg"
    assert "fast_lis" in arch.channels[0].observers
    assert "bar_sub" in arch.channels[0].observers

    assert arch.channels[1].name == "status_chan"
    assert arch.channels[1].observers == []

    assert len(arch.observers) == 2
    observer_names = {o.name for o in arch.observers}
    assert observer_names == {"fast_lis", "bar_sub"}

    assert len(arch.threads) == 1
    assert arch.threads[0].name == "bar_sub_thread"
