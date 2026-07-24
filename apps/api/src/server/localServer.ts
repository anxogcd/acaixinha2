import express from "express";
import "reflect-metadata";
import { container } from "../shared/infrastructure/di/container.js";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// User handlers
import { CreateUserHandler } from "../user/infrastructure/delivery/CreateUserHandler.js";
import { GetUserHandler } from "../user/infrastructure/delivery/GetUserHandler.js";
import { UpdateUserProfileHandler } from "../user/infrastructure/delivery/UpdateUserProfileHandler.js";
import { DeleteUserHandler } from "../user/infrastructure/delivery/DeleteUserHandler.js";

// Memory handlers
import { CreateMemoryHandler } from "../memory/infrastructure/delivery/CreateMemoryHandler.js";
import { GetMemoryHandler } from "../memory/infrastructure/delivery/GetMemoryHandler.js";
import { UpdateMemoryHandler } from "../memory/infrastructure/delivery/UpdateMemoryHandler.js";
import { DeleteMemoryHandler } from "../memory/infrastructure/delivery/DeleteMemoryHandler.js";
import { ListMemoriesHandler } from "../memory/infrastructure/delivery/ListMemoriesHandler.js";
import { SearchMemoriesHandler } from "../memory/infrastructure/delivery/SearchMemoriesHandler.js";
import { ShareMemoryHandler } from "../memory/infrastructure/delivery/ShareMemoryHandler.js";
import { UnshareMemoryHandler } from "../memory/infrastructure/delivery/UnshareMemoryHandler.js";
import { AddAttachmentHandler } from "../memory/infrastructure/delivery/AddAttachmentHandler.js";
import { RemoveAttachmentHandler } from "../memory/infrastructure/delivery/RemoveAttachmentHandler.js";

// Auth middleware
import type { AuthContext } from "../shared/infrastructure/auth/withAuth.js";

type LambdaHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

function toLambdaEvent(req: express.Request): APIGatewayProxyEvent {
  return {
    httpMethod: req.method,
    path: req.path,
    headers: Object.entries(req.headers).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: String(v ?? "") }),
      {} as Record<string, string>,
    ),
    queryStringParameters:
      Object.keys(req.query).length > 0
        ? Object.entries(req.query).reduce<Record<string, string | undefined>>(
            (acc, [k, v]) => ({ ...acc, [k]: typeof v === "string" ? v : undefined }),
            {} as Record<string, string | undefined>,
          )
        : null,
    pathParameters: req.params && Object.keys(req.params).length > 0
      ? Object.entries(req.params).reduce(
          (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
          {} as Record<string, string>,
        )
      : null,
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
    resource: req.route?.path ?? req.path,
    requestContext: {} as APIGatewayProxyEvent["requestContext"],
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
  };
}

function wrapHandler(handler: LambdaHandler): express.RequestHandler {
  return async (req, res) => {
    try {
      const event = toLambdaEvent(req);
      const result = await handler(event);
      res.status(result.statusCode).set(result.headers);
      if (result.body) {
        res.json(JSON.parse(result.body));
      } else {
        res.end();
      }
    } catch (err) {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Dev auth middleware: injects a fake user ID from Authorization header
// In production, Cognito handles this. For local dev, pass userId as Bearer token.
function devAuth(handler: (req: express.Request, res: express.Response, ctx: AuthContext) => void): express.RequestHandler {
  return (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = "dev-user";
    if (authHeader?.startsWith("Bearer ")) {
      userId = authHeader.slice(7);
    }
    const ctx: AuthContext = {
      userId,
      claims: { sub: userId, username: userId, email: `${userId}@example.com` },
    };
    handler(req, res, ctx);
  };
}

export function registerRoutes(app: express.Application): void {
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const createUserHandler = container.resolve(CreateUserHandler);
  app.post("/users", wrapHandler(createUserHandler.handle.bind(createUserHandler)));

  const getUserHandler = container.resolve(GetUserHandler);
  app.get("/users/:userId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    getUserHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const updateUserProfileHandler = container.resolve(UpdateUserProfileHandler);
  app.patch("/users/:userId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    updateUserProfileHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const deleteUserHandler = container.resolve(DeleteUserHandler);
  app.delete("/users/:userId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    deleteUserHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  // Memory routes
  const createMemoryHandler = container.resolve(CreateMemoryHandler);
  app.post("/memories", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    createMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const getMemoryHandler = container.resolve(GetMemoryHandler);
  app.get("/memories/:memoryId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    getMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const updateMemoryHandler = container.resolve(UpdateMemoryHandler);
  app.patch("/memories/:memoryId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    updateMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const deleteMemoryHandler = container.resolve(DeleteMemoryHandler);
  app.delete("/memories/:memoryId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    deleteMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const listMemoriesHandler = container.resolve(ListMemoriesHandler);
  app.get("/memories", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    listMemoriesHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const searchMemoriesHandler = container.resolve(SearchMemoriesHandler);
  app.get("/memories/search", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    searchMemoriesHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const shareMemoryHandler = container.resolve(ShareMemoryHandler);
  app.post("/memories/:memoryId/share", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    shareMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const unshareMemoryHandler = container.resolve(UnshareMemoryHandler);
  app.delete("/memories/:memoryId/share/:userId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    unshareMemoryHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const addAttachmentHandler = container.resolve(AddAttachmentHandler);
  app.post("/memories/:memoryId/attachments", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    addAttachmentHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));

  const removeAttachmentHandler = container.resolve(RemoveAttachmentHandler);
  app.delete("/memories/:memoryId/attachments/:attachmentId", devAuth((req, res, ctx) => {
    const event = toLambdaEvent(req);
    removeAttachmentHandler.handle(event, ctx).then((result) => {
      res.status(result.statusCode).set(result.headers);
      if (result.body) res.json(JSON.parse(result.body));
      else res.end();
    }).catch((err) => {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    });
  }));
}

function main(): void {
  const app = express();
  app.use(express.json());

  registerRoutes(app);

  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
    console.log("Dev auth: pass user ID as Authorization: Bearer <userId>");
  });
}

main();
