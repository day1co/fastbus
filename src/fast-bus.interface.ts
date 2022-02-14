export interface BaseBus {
  publish(topic: string, message: string, broadcast: boolean): void;
  subscribe(topic: string, listener: FastBusSubscriber): void;
  unsubscribe(topic, listener: FastBusSubscriber): void;
  unsubscribeAll(topic?: string): void;
  destroy(): void;
}

export interface FastBusOpts {
  prefix?: string;
}

export type FastBusSubscriber = (message: string) => void;
