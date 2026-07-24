import type { APIGatewayProxyResult } from "aws-lambda";
import { corsHeaders } from "./cors.js";

interface DomainError extends Error {
  code?: string;
}

const STATUS_MAP: Record<string, number> = {
  USER_NOT_FOUND: 404,
  MEMORY_NOT_FOUND: 404,
  USER_ALREADY_EXISTS: 409,
  UNAUTHORIZED_MEMORY_ACCESS: 403,
  INVALID_USERNAME: 400,
  INVALID_COORDINATES: 400,
  INVALID_TAG: 400,
  ATTACHMENT_LIMIT_EXCEEDED: 400,
};

export function mapErrorToHttpResponse(error: Error): APIGatewayProxyResult {
  const domainError = error as DomainError;
  const statusCode = (domainError.code && STATUS_MAP[domainError.code]) || 500;

  if (statusCode === 500) {
    console.error("Unhandled error:", error);
  }

  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({
      code: domainError.code ?? "INTERNAL_ERROR",
      message: error.message,
    }),
  };
}