import { randomUUID } from "node:crypto";

export abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;

  constructor(aggregateId: string) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
  }
}
