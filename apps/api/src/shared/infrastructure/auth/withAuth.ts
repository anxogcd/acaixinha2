import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getVerifier } from "./CognitoJwtVerifier.js";
import { corsHeaders } from "../delivery/cors.js";

export interface AuthContext {
  userId: string;
  claims: {
    sub: string;
    username: string;
    email: string;
  };
}

type AuthenticatedHandler = (
  event: APIGatewayProxyEvent,
  context: AuthContext,
) => Promise<APIGatewayProxyResult>;

function unauthorized(message: string): APIGatewayProxyResult {
  return {
    statusCode: 401,
    headers: corsHeaders,
    body: JSON.stringify({ code: "UNAUTHORIZED", message }),
  };
}

export function withAuth(handler: AuthenticatedHandler) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const authHeader = event.headers["Authorization"] || event.headers["authorization"];

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return unauthorized("Missing or invalid Authorization header");
      }

      const token = authHeader.slice(7);
      const v = getVerifier();
      const payload = await v.verify(token);

      if (!payload.sub) {
        return unauthorized("Token missing sub claim");
      }

      const ctx: AuthContext = {
        userId: payload.sub,
        claims: {
          sub: payload.sub,
          username: (payload["cognito:username"] ?? payload.sub) as string,
          email: (payload.email ?? "") as string,
        },
      };

      return handler(event, ctx);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "JwtInvalidClaimError" ||
          err.name === "JwtExpiredError" ||
          err.name === "JwkInvalidError")
      ) {
        return unauthorized("Invalid or expired token");
      }

      console.error("Auth error:", err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ code: "INTERNAL_ERROR", message: "Authentication error" }),
      };
    }
  };
}