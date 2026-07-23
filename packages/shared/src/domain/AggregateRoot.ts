import { DomainEvent } from "./DomainEvent.js";

export abstract class AggregateRoot<TId> {
  readonly id: TId;
  readonly createdAt: Date;
  updatedAt: Date;

  private _events: DomainEvent[] = [];

  constructor(id: TId, createdAt?: Date) {
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = this.createdAt;
  }

  record(event: DomainEvent): void {
    this._events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }

  touch(): void {
    this.updatedAt = new Date();
  }
}
