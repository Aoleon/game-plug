import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupWebSocket } from "./websocket";
import path from "path";
import { autoMigrateAvatarsOnStartup } from "./auto-migrate";
import { reconcileCharacterAvatars } from "./reconcile-avatars";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static avatar files
app.use('/avatars', express.static(path.join(process.cwd(), 'public', 'avatars')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create a single HTTP server
  const server = createServer(app);

  // Setup WebSocket before routes
  setupWebSocket(server);

  // Register routes (no longer creates its own server)
  await registerRoutes(app);

  // In production, setup static file serving BEFORE starting the server
  // This ensures the catch-all route is registered before error handler
  const isProduction = app.get("env") !== "development";
  if (isProduction) {
    log("Setting up static file serving (production mode)");
    serveStatic(app);
    log("Static file serving configured");
  }

  // Error handler must be registered AFTER all routes and static file serving
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);

    // In development, setup Vite AFTER server is listening
    // This is required so server.address() is not null for HMR WebSocket
    if (!isProduction) {
      log("Setting up Vite dev server");
      await setupVite(app, server);
      log("Vite dev server configured");
    }

    // Run avatar migration in background after server starts
    autoMigrateAvatarsOnStartup()
      .then(() => reconcileCharacterAvatars())
      .catch(console.error);
  });
})();
