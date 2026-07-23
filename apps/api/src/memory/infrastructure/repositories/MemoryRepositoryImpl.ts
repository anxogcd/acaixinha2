import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";
import { injectable } from "tsyringe";
import type {
  IMemoryRepository,
  MemorySearchFilters,
} from "../../domain/repositories/IMemoryRepository.js";
import type { Memory } from "../../domain/models/Memory.js";
import { MemoryId } from "../../domain/value-objects/MemoryId.js";
import { MemoryNotFoundException } from "../../domain/exceptions/MemoryNotFoundException.js";
import { getDynamoDBClient } from "../../../shared/infrastructure/persistence/DynamoDBClientFactory.js";
import { MemoryMapper } from "./MemoryMapper.js";
import type { MemoryEntity } from "../entities/MemoryEntity.js";

const MEMORIES_TABLE = process.env.DYNAMODB_MEMORIES_TABLE ?? "Memories";
const MEMORY_SHARES_TABLE = process.env.DYNAMODB_MEMORY_SHARES_TABLE ?? "MemoryShares";
const OWNER_ID_INDEX = "ownerId-index";

@injectable()
export class MemoryRepositoryImpl implements IMemoryRepository {
  private readonly client = getDynamoDBClient();

  async findById(id: MemoryId): Promise<Memory | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: MEMORIES_TABLE,
        Key: { id: id.value },
      }),
    );

    if (!result.Item) return null;

    return MemoryMapper.toDomain(result.Item as MemoryEntity);
  }

  async findByOwner(ownerId: string): Promise<Memory[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: MEMORIES_TABLE,
        IndexName: OWNER_ID_INDEX,
        KeyConditionExpression: "ownerId = :ownerId",
        ExpressionAttributeValues: {
          ":ownerId": ownerId,
        },
      }),
    );

    if (!result.Items || result.Items.length === 0) return [];

    return result.Items.map((item) => MemoryMapper.toDomain(item as MemoryEntity));
  }

  async findBySharedWith(userId: string): Promise<Memory[]> {
    const sharesResult = await this.client.send(
      new QueryCommand({
        TableName: MEMORY_SHARES_TABLE,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
      }),
    );

    if (!sharesResult.Items || sharesResult.Items.length === 0) return [];

    const memoryIds = sharesResult.Items.map(
      (item: Record<string, unknown>) => item.memoryId as string,
    );

    const keys = memoryIds.map((id: string) => ({ id }));
    const batchResult = await this.client.send(
      new BatchGetCommand({
        RequestItems: {
          [MEMORIES_TABLE]: {
            Keys: keys,
          },
        },
      }),
    );

    const items = batchResult.Responses?.[MEMORIES_TABLE] ?? [];
    return items.map((item) => MemoryMapper.toDomain(item as MemoryEntity));
  }

  async search(filters: MemorySearchFilters): Promise<Memory[]> {
    const ownerId = filters.ownerId;
    if (!ownerId) return [];

    const memories = await this.findByOwner(ownerId);

    return memories.filter((memory) => {
      if (filters.tags && filters.tags.length > 0) {
        const memoryTags = memory.tags.map((t) => t.value);
        const hasAnyTag = filters.tags.some((t) => memoryTags.includes(t));
        if (!hasAnyTag) return false;
      }

      if (filters.text) {
        const searchText = filters.text.toLowerCase();
        const titleMatch = memory.title.value.toLowerCase().includes(searchText);
        const descMatch = memory.description.value.toLowerCase().includes(searchText);
        if (!titleMatch && !descMatch) return false;
      }

      if (filters.dateFrom) {
        if (memory.memoryDate < filters.dateFrom) return false;
      }

      if (filters.dateTo) {
        if (memory.memoryDate > filters.dateTo) return false;
      }

      return true;
    });
  }

  async save(memory: Memory): Promise<void> {
    const entity = MemoryMapper.toPersistence(memory);

    await this.client.send(
      new PutCommand({
        TableName: MEMORIES_TABLE,
        Item: entity,
      }),
    );

    await this.syncMemoryShares(memory);
  }

  async delete(id: MemoryId): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new MemoryNotFoundException(id.value);
    }

    await this.client.send(
      new DeleteCommand({
        TableName: MEMORIES_TABLE,
        Key: { id: id.value },
      }),
    );

    await this.deleteAllMemoryShares(id.value);
  }

  private async syncMemoryShares(memory: Memory): Promise<void> {
    const memoryId = memory.id.value;

    const existingResult = await this.client.send(
      new QueryCommand({
        TableName: MEMORY_SHARES_TABLE,
        KeyConditionExpression: "memoryId = :memoryId",
        IndexName: "memoryId-index",
        ExpressionAttributeValues: {
          ":memoryId": memoryId,
        },
      }),
    );

    const existingShares = new Set(
      (existingResult.Items ?? []).map((item: Record<string, unknown>) => item.userId as string),
    );

    const currentShares = new Set(memory.sharedWithUserIds);

    for (const userId of existingShares) {
      if (!currentShares.has(userId)) {
        await this.client.send(
          new DeleteCommand({
            TableName: MEMORY_SHARES_TABLE,
            Key: { userId, memoryId },
          }),
        );
      }
    }

    for (const userId of currentShares) {
      if (!existingShares.has(userId)) {
        await this.client.send(
          new PutCommand({
            TableName: MEMORY_SHARES_TABLE,
            Item: { userId, memoryId },
          }),
        );
      }
    }
  }

  private async deleteAllMemoryShares(memoryId: string): Promise<void> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: MEMORY_SHARES_TABLE,
        KeyConditionExpression: "memoryId = :memoryId",
        IndexName: "memoryId-index",
        ExpressionAttributeValues: {
          ":memoryId": memoryId,
        },
      }),
    );

    for (const item of result.Items ?? []) {
      const shareItem = item as Record<string, unknown>;
      await this.client.send(
        new DeleteCommand({
          TableName: MEMORY_SHARES_TABLE,
          Key: { userId: shareItem.userId as string, memoryId },
        }),
      );
    }
  }
}
