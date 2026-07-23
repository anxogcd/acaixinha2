import express from "express";
import "reflect-metadata";
import { container as _container } from "tsyringe";

interface LambdaEvent {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string> | null;
  pathParameters: Record<string, string> | null;
  body: string | null;
}

interface LambdaResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

type HandlerFn = (event: LambdaEvent) => Promise<LambdaResult>;

function toLambdaEvent(req: express.Request): LambdaEvent {
  return {
    httpMethod: req.method,
    path: req.path,
    headers: Object.entries(req.headers).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: String(v ?? "") }),
      {} as Record<string, string>,
    ),
    queryStringParameters:
      Object.keys(req.query).length > 0
        ? Object.entries(req.query).reduce<Record<string, string>>(
            (acc, [k, v]) => ({ ...acc, [k]: typeof v === "string" ? v : "" }),
            {} as Record<string, string>,
          )
        : null,
    pathParameters:
      req.params && Object.keys(req.params).length > 0
        ? Object.entries(req.params).reduce(
            (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
            {} as Record<string, string>,
          )
        : null,
    body: req.body ? JSON.stringify(req.body) : null,
  };
}

function _wrapHandler(handler: HandlerFn): express.RequestHandler {
  return async (req, res) => {
    try {
      const event = toLambdaEvent(req);
      const result = await handler(event);
      res.status(result.statusCode).set(result.headers).json(JSON.parse(result.body));
    } catch (err) {
      console.error("Handler error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function registerRoutes(app: express.Application): void {
  // Placeholder routes — will be replaced with actual handlers in later tasks
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Example of registering a Lambda handler:
  // const getUserHandler = container.resolve<HandlerFn>("GetUserHandler");
  // app.get("/users/:id", wrapHandler(getUserHandler));
}

function main(): void {
  const app = express();
  app.use(express.json());

  registerRoutes(app);

  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
}

main();
