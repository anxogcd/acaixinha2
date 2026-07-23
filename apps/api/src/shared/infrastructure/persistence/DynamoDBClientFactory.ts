import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let instance: DynamoDBDocumentClient | null = null;

export function getDynamoDBClient(): DynamoDBDocumentClient {
  if (instance) return instance;

  const endpoint = process.env.DYNAMODB_ENDPOINT;
  const region = process.env.AWS_REGION ?? "eu-west-1";

  const client = new DynamoDBClient({
    region,
    ...(endpoint ? { endpoint } : {}),
  });

  instance = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: false,
    },
  });

  return instance;
}

export function resetDynamoDBClient(): void {
  instance = null;
}
