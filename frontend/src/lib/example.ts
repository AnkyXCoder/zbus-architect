export const HELLO_WORLD_EXAMPLE = `#include <zephyr/zbus/zbus.h>

struct acc_msg {
    int x;
    int y;
    int z;
};

ZBUS_CHAN_DEFINE(
    acc_chan,
    struct acc_msg,
    NULL,
    NULL,
    ZBUS_OBSERVERS(fast_lis, bar_sub),
    ZBUS_MSG_INIT(0)
);

ZBUS_CHAN_DEFINE(
    status_chan,
    int,
    NULL,
    NULL,
    ZBUS_OBSERVERS_EMPTY,
    ZBUS_MSG_INIT(0)
);

ZBUS_LISTENER_DEFINE(fast_lis, fast_listener_callback);

ZBUS_SUBSCRIBER_DEFINE(bar_sub, 4);

K_THREAD_DEFINE(
    bar_sub_thread,
    1024,
    bar_sub_thread_entry,
    NULL, NULL, NULL,
    5,
    0,
    0
);
`;

export const TUTORIAL_STEPS = [
  "Click \"Load example\" below to see a ready-made zbus design on the canvas.",
  "Drag a component from the left sidebar and drop it onto the canvas.",
  "Click a node to edit its properties in the right panel, then press Save.",
  "Drag from the right edge of a channel to the left edge of an observer to connect them.",
  "Click \"Check\" to validate your design for duplicate names, unobserved channels, and cycles.",
  "Click \"Export\" to download zbus_messages.h, zbus_channels.h, and zbus_observers.c.",
  "Click \"Clear\" at any time to wipe the canvas and start your own configuration.",
];
