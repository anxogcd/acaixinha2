import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { ZodType, ZodError } from "zod";
import { corsHeaders } from "./cors.js";
import { mapErrorToHttpResponse } from "./HttpErrorMapper.js";

export type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export function parseEvent(event: APIGatewayProxyEvent): Record<string, unknown> {
  let body: unknown = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch {
      body = {};
    }
  }

  const queryParams: Record<string, string | undefined> = {};
  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      queryParams[key] = value;
    }
  }

  return {
    ...(typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {}),
    ...(event.pathParameters ?? {}),
    ...queryParams,
  };
}

function formatZodError(error: ZodError): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: corsHeaders,
    body: JSON.stringify({
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      details: error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    }),
  };
}

export class LambdaHandlerBuilder<T> {
  private schema: ZodType<T> | null = null;

  validate(schema: ZodType<T>): this {
    this.schema = schema;
    return this;
  }

  handle(
    fn: (event: APIGatewayProxyEvent, parsed: T) => Promise<APIGatewayProxyResult>,
  ): LambdaHandler {
    const schema = this.schema;

    return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      try {
        if (schema) {
          const raw = parseEvent(event);
          const result = schema.safeParse(raw);
          if (!result.success) {
            return formatZodError(result.error);
          }
          return await fn(event, result.data);
        }
        return await fn(event, undefined as unknown as T);
      } catch (err) {
        if (err instanceof Error) {
          return mapErrorToHttpResponse(err);
        }
        console.error("Unknown error:", err);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ code: "INTERNAL_ERROR", message: "Unknown error" }),
        };
      }
    };
  }
}
