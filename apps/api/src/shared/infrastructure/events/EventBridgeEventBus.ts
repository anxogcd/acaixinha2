import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { injectable } from "tsyringe";
import type { IEventBus, DomainEvent } from "@acaixinha/shared";

@injectable()
export class EventBridgeEventBus implements IEventBus {
  private readonly client = new EventBridgeClient({
    region: process.env.AWS_REGION ?? "eu-west-1",
  });
  private readonly eventBusName = process.env.EVENT_BUS_NAME ?? "default";

  async publish(event: DomainEvent): Promise<void> {
    try {
      await this.client.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: "acaixinha.api",
              DetailType: event.constructor.name,
              Detail: JSON.stringify(event),
              EventBusName: this.eventBusName,
            },
          ],
        }),
      );
    } catch (err) {
      console.error("Failed to publish event to EventBridge:", err);
    }
  }
}