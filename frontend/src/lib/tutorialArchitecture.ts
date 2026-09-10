import type { Architecture } from "@/lib/types";

export const TUTORIAL_ARCHITECTURE: Architecture = {
  messages: [
    {
      name: "version_msg",
      definition: "struct version_msg {\n    uint8_t major;\n    uint8_t minor;\n    uint16_t build;\n};",
    },
    {
      name: "acc_msg",
      definition: "struct acc_msg {\n    int x;\n    int y;\n    int z;\n};",
    },
    {
      name: "sensor_msg",
      definition: "struct sensor_msg {\n    int value;\n};",
    },
  ],
  channels: [
    {
      name: "version_chan",
      message_type: "struct version_msg",
      validator: null,
      user_data: null,
      observers: ["foo_lis", "bar_sub", "msg_sub", "baz_async_lis", "proxy0_listener"],
      initial_value: "ZBUS_MSG_INIT(.major = 0, .minor = 1, .build = 2)",
      is_shadow: false,
      proxy_agent: null,
    },
    {
      name: "acc_chan",
      message_type: "struct acc_msg",
      validator: null,
      user_data: null,
      observers: ["foo_lis", "bar_sub"],
      initial_value: "ZBUS_MSG_INIT(.x = 0, .y = 0, .z = 0)",
      is_shadow: false,
      proxy_agent: null,
    },
    {
      name: "simple_chan",
      message_type: "int",
      validator: "simple_chan_validator",
      user_data: null,
      observers: ["foo_lis"],
      initial_value: "ZBUS_MSG_INIT(0)",
      is_shadow: false,
      proxy_agent: null,
    },
    {
      name: "status_chan",
      message_type: "int",
      validator: null,
      user_data: null,
      observers: [],
      initial_value: "ZBUS_MSG_INIT(0)",
      is_shadow: false,
      proxy_agent: null,
    },
    {
      name: "shadow_chan",
      message_type: "struct sensor_msg",
      validator: null,
      user_data: null,
      observers: [],
      initial_value: "ZBUS_MSG_INIT(.value = 0)",
      is_shadow: true,
      proxy_agent: "proxy0",
    },
  ],
  observers: [
    {
      name: "foo_lis",
      kind: "listener",
      callback: "listener_callback_example",
      enabled: true,
    },
    {
      name: "bar_sub",
      kind: "subscriber",
      queue_size: 4,
      enabled: true,
    },
    {
      name: "msg_sub",
      kind: "msg_subscriber",
      enabled: true,
    },
    {
      name: "baz_async_lis",
      kind: "async_listener",
      callback: "async_listener_callback_example",
      enabled: true,
    },
    {
      name: "proxy0_listener",
      kind: "listener",
      callback: "proxy0_zbus_listener_cb",
      enabled: true,
    },
  ],
  threads: [
    {
      name: "subscriber_task_id",
      entry: "subscriber_task",
      stack_size: 1024,
      priority: 5,
      options: 0,
      delay: 0,
    },
  ],
  proxy_agents: [
    {
      name: "proxy0",
      backend_type: "ZBUS_PROXY_AGENT_BACKEND_IPC",
      backend_dt_node: "DT_CHOSEN(zbus_proxy)",
      channels: ["acc_chan"],
    },
  ],
  add_observations: [
    {
      channel: "status_chan",
      observer: "foo_lis",
      priority: "2",
      masked: false,
    },
    {
      channel: "acc_chan",
      observer: "proxy0_listener",
      priority: "zz",
      masked: false,
    },
    {
      channel: "simple_chan",
      observer: "foo_lis",
      priority: "1",
      masked: true,
    },
  ],
};

export const TUTORIAL_STEPS = [
  "Click \"Load example\" below to see a complete zbus design on the canvas.",
  "Drag a component from the left sidebar and drop it onto the canvas.",
  "Click a node to edit its properties in the right panel, then press Save.",
  "Drag from the right edge of a channel to the left edge of an observer to connect them.",
  "Click \"Simulate publish\" on a channel to watch data flow along the arrows.",
  "Click \"Check\" to validate your design for duplicate names, unobserved channels, and cycles.",
  "Click \"Export\" to download zbus_messages.h, zbus_channels.h, and zbus_observers.c.",
  "Click \"Clear\" at any time to wipe the canvas and start your own configuration.",
];
