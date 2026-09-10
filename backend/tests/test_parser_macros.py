import pytest

from zbus_architect.parser import parse_source


SOURCE = """
#include <zephyr/zbus/zbus.h>

struct sensor_msg {
    int value;
};

ZBUS_CHAN_DEFINE(
    temp_chan,
    struct sensor_msg,
    NULL,
    NULL,
    ZBUS_OBSERVERS(foo_listener),
    ZBUS_MSG_INIT(0)
);

ZBUS_LISTENER_DEFINE_WITH_ENABLE(foo_listener, foo_cb, false);

ZBUS_SUBSCRIBER_DEFINE_WITH_ENABLE(bar_sub, 4, true);

ZBUS_MSG_SUBSCRIBER_DEFINE_WITH_ENABLE(msg_sub, true);

ZBUS_ASYNC_LISTENER_DEFINE_WITH_ENABLE(baz_async, async_cb, true);

ZBUS_PROXY_AGENT_DEFINE(proxy0, ZBUS_PROXY_AGENT_BACKEND_IPC, DT_CHOSEN(zbus_proxy));

ZBUS_SHADOW_CHAN_DEFINE(
    shadow_chan,
    struct sensor_msg,
    proxy0,
    NULL,
    ZBUS_OBSERVERS_EMPTY,
    ZBUS_MSG_INIT(0)
);

ZBUS_PROXY_ADD_CHAN(proxy0, temp_chan);
"""


def test_with_enable_and_proxy():
    arch = parse_source(SOURCE)
    assert len(arch.channels) == 2
    assert len(arch.observers) == 4
    observers = arch.by_observer_name()
    assert observers["foo_listener"].enabled is False
    assert observers["bar_sub"].enabled is True
    assert observers["msg_sub"].enabled is True
    assert observers["baz_async"].enabled is True

    shadow = arch.by_channel_name()["shadow_chan"]
    assert shadow.is_shadow
    assert shadow.proxy_agent == "proxy0"

    assert len(arch.proxy_agents) == 1
    assert arch.proxy_agents[0].name == "proxy0"

    assert any(
        o.channel == "temp_chan" and o.observer == "proxy0_listener" and o.priority == "zz"
        for o in arch.add_observations
    )
