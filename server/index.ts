import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers"; // Adjust path if your routers.ts is elsewhere
import { createContext } from "./_core/context";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Add CORS middleware
  app.use(cors({
    origin: process.env.NODE_ENV === "production" 
      ? ["https://fridgees-casino.onrender.com", "https://fridgee-casino.vercel.app"] 
      : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }));

  // DEBUG: Log environment variables (remove after fixing)
  console.log("=== ENVIRONMENT CHECK ===");
  console.log("PORT:", process.env.PORT);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("OWNER_OPEN_ID:", process.env.OWNER_OPEN_ID);
  console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
  console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("=========================");

  // tRPC middleware - YOUR BACKEND API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error }) => {
        console.error("tRPC Error:", error);
      },
    })
  );

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}/`);
    console.log(`📡 tRPC API: http://localhost:${port}/api/trpc`);
    console.log(`🌍 Live URL: https://fridgees-casino.onrender.com`);
  });
}

startServer().catch(console.error);
