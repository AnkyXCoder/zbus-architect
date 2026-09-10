#include <stdbool.h>
#include <stdint.h>
#include <zephyr/kernel.h>
#include <zephyr/zbus/zbus.h>

struct version_msg {
    uint8_t major;
    uint8_t minor;
    uint16_t build;
};

struct acc_msg {
    int x;
    int y;
    int z;
};

bool simple_chan_validator(const void *msg, size_t msg_size)
{
    (void)msg;
    (void)msg_size;

    return true;
}

void listener_callback_example(const struct zbus_channel *chan)
{
    (void)chan;
}

void async_listener_callback_example(const struct zbus_channel *chan, const void *message)
{
    (void)chan;
    (void)message;
}

void subscriber_task(void *p1, void *p2, void *p3)
{
    (void)p1;
    (void)p2;
    (void)p3;
}

#include "zbus_channels.h"
#include "zbus_observers.c"

int main(void)
{
    return 0;
}
