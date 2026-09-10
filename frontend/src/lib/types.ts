export interface MessageType {
  name: string;
  definition?: string;
  size?: number | null;
  alignment?: number | null;
}

export interface Observer {
  name: string;
  kind: "listener" | "subscriber" | "msg_subscriber" | "async_listener";
  callback?: string | null;
  queue_size?: number | null;
  work_queue?: string | null;
  enabled: boolean;
  priority?: number | null;
}

export interface Thread {
  name: string;
  entry?: string | null;
  stack_size?: number | null;
  priority?: number | null;
  options?: number | null;
  delay?: number | null;
}

export interface ProxyAgent {
  name: string;
  backend_type: string;
  backend_dt_node: string;
  channels?: string[];
}

export interface Channel {
  name: string;
  message_type: string;
  channel_id?: number | null;
  validator?: string | null;
  user_data?: string | null;
  observers: string[];
  initial_value?: string | null;
  is_shadow?: boolean;
  proxy_agent?: string | null;
}

export interface ChannelObservation {
  channel: string;
  observer: string;
  priority?: string | null;
  masked?: boolean;
}

export interface Architecture {
  channels: Channel[];
  observers: Observer[];
  threads: Thread[];
  proxy_agents: ProxyAgent[];
  add_observations: ChannelObservation[];
  messages: MessageType[];
}

export interface ZbusCheck {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  channel: string | null;
  observer: string | null;
  thread: string | null;
}
