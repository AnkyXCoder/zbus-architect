#include <stdbool.h>
#include <zephyr/kernel.h>
#include <zephyr/zbus/zbus.h>

bool simple_chan_validator(const void *msg, size_t msg_size)
{
    (void)msg;
    (void)msg_size;

    return true;
}

#include "zbus_channels.h"

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

#include "zbus_observers.c"

int main(void)
{
    return 0;
}
