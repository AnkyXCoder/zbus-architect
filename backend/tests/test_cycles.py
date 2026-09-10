from zbus_architect.checks import detect_cycles
from zbus_architect.parser import parse_source


SOURCE = """
#include <zephyr/zbus/zbus.h>

struct msg { int v; };

ZBUS_CHAN_DEFINE(a, struct msg, NULL, NULL, ZBUS_OBSERVERS(lis_a), ZBUS_MSG_INIT(0));
ZBUS_CHAN_DEFINE(b, struct msg, NULL, NULL, ZBUS_OBSERVERS(lis_b), ZBUS_MSG_INIT(0));

void lis_a_cb(const struct zbus_channel *chan)
{
    (void)chan;
    zbus_chan_pub(&b, &(struct msg){1}, K_MSEC(100));
}

void lis_b_cb(const struct zbus_channel *chan)
{
    (void)chan;
    zbus_chan_pub(&a, &(struct msg){2}, K_MSEC(100));
}

ZBUS_LISTENER_DEFINE(lis_a, lis_a_cb);
ZBUS_LISTENER_DEFINE(lis_b, lis_b_cb);
"""


def test_cycle():
    arch = parse_source(SOURCE)
    checks = detect_cycles(arch, SOURCE)
    assert any(c.id == "cycle-detected" for c in checks)
