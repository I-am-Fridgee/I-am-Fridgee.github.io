import express from "express";
import { createServer } from "http";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // === CRITICAL DEBUG - THIS MUST PRINT ===
  console.log("🔬 [DIAGNOSTIC] Server process starting...");
  console.log("🔬 [DIAGNOSTIC] Node version:", process.version);
  console.log("🔬 [DIAGNOSTIC] NODE_ENV:", process.env.NODE_ENV);
  console.log("🔬 [DIAGNOSTIC] Checking for DATABASE_URL key:", 'DATABASE_URL' in process.env);
  console.log("🔬 [DIAGNOSTIC] All env keys:", Object.keys(process.env).sort());
  // === END DEBUG ===

  // Basic route to confirm server is up
  app.get("/", (_req, res) => {
    res.send("Diagnostic server is running");
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`🔬 [DIAGNOSTIC] Server listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("🔬 [DIAGNOSTIC] Failed to start server:", error);
  process.exit(1);
});
