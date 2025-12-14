import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, leaderboard, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert using ON CONFLICT
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Leaderboard functions
export async function getTopPlayers(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get top players: database not available");
    return [];
  }

  try {
    const result = await db
      .select({
        userId: leaderboard.userId,
        username: leaderboard.username,
        highScore: leaderboard.highScore,
        updatedAt: leaderboard.updatedAt,
      })
      .from(leaderboard)
      .orderBy(desc(leaderboard.highScore))
      .limit(limit);

    return result;
  } catch (error) {
    console.error("[Database] Error getting top players:", error);
    return [];
  }
}

export async function updatePlayerScore(userId: number, username: string, score: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update player score: database not available");
    return;
  }

  try {
    // Check if player exists
    const existing = await db
      .select()
      .from(leaderboard)
      .where(eq(leaderboard.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // Only update if new score is higher
      if (score > existing[0].highScore) {
        await db
          .update(leaderboard)
          .set({ highScore: score, username, updatedAt: new Date() })
          .where(eq(leaderboard.userId, userId));
      }
    } else {
      // Insert new entry
      await db.insert(leaderboard).values({
        userId,
        username,
        highScore: score,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to update player score:", error);
    throw error;
  }
}

export async function getPlayerRank(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get player rank: database not available");
    return null;
  }

  const allPlayers = await db
    .select()
    .from(leaderboard)
    .orderBy(desc(leaderboard.highScore));

  const rank = allPlayers.findIndex(p => p.userId === userId) + 1;
  return rank > 0 ? rank : null;
}

// Cleanup function for graceful shutdown
export async function closeDb() {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}
