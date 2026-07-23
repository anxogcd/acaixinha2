import { GetCommand, PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { injectable } from "tsyringe";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import type { User } from "../../domain/models/User.js";
import { UserId } from "../../domain/value-objects/UserId.js";
import type { UserUsername } from "../../domain/value-objects/UserUsername.js";
import { UserNotFoundException } from "../../domain/exceptions/UserNotFoundException.js";
import { UserAlreadyExistsException } from "../../domain/exceptions/UserAlreadyExistsException.js";
import { getDynamoDBClient } from "../../../shared/infrastructure/persistence/DynamoDBClientFactory.js";
import { UserMapper } from "./UserMapper.js";
import type { UserEntity } from "../entities/UserEntity.js";

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE ?? "Users";

@injectable()
export class UserRepositoryImpl implements IUserRepository {
  private readonly client = getDynamoDBClient();

  async findById(id: UserId): Promise<User | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { id: id.value },
      }),
    );

    if (!result.Item) return null;

    return UserMapper.toDomain(result.Item as UserEntity);
  }

  async findByUsername(username: UserUsername): Promise<User | null> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: "username = :username",
        ExpressionAttributeValues: {
          ":username": username.value,
        },
        Limit: 1,
      }),
    );

    if (!result.Items || result.Items.length === 0) return null;

    return UserMapper.toDomain(result.Items[0] as UserEntity);
  }

  async save(user: User): Promise<void> {
    const existing = await this.findById(user.id);

    if (!existing) {
      const byUsername = await this.findByUsername(user.username);
      if (byUsername && !byUsername.id.equals(user.id)) {
        throw new UserAlreadyExistsException(user.username.value);
      }
    }

    const entity = UserMapper.toPersistence(user);

    await this.client.send(
      new PutCommand({
        TableName: USERS_TABLE,
        Item: entity,
      }),
    );
  }

  async delete(id: UserId): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new UserNotFoundException(id.value);
    }

    await this.client.send(
      new DeleteCommand({
        TableName: USERS_TABLE,
        Key: { id: id.value },
      }),
    );
  }
}
