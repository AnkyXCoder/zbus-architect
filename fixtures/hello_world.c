#include <zephyr/zbus/zbus.h>

struct acc_msg {
    int x;
    int y;
    int z;
};

ZBUS_CHAN_DEFINE(
    acc_chan,          /* Name */
    struct acc_msg,    /* Message type */
    NULL,              /* Validator */
    NULL,              /* User data */
    ZBUS_OBSERVERS(fast_lis, bar_sub), /* Observers */
    ZBUS_MSG_INIT(0)   /* Initial value */
);

ZBUS_CHAN_DEFINE(
    status_chan,       /* Name */
    int,               /* Message type */
    NULL,              /* Validator */
    NULL,              /* User data */
    ZBUS_OBSERVERS_EMPTY, /* Observers */
    ZBUS_MSG_INIT(0)   /* Initial value */
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
