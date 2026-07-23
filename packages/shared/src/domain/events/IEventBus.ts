import { DomainEvent } from "../DomainEvent.js";

export const DITOKEN_IEVENT_BUS = Symbol("IEventBus");

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
}
