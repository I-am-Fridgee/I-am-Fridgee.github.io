import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import type { Request } from "express";
import { ForbiddenError } from "@shared/_core/errors";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

// Initialize Firebase Admin SDK
const firebaseApp = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  // If you have a service account key, use it:
  // credential: cert(require('./path/to/serviceAccountKey.json'))
});

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

/**
 * Verify Firebase ID token from request header
 * Expects: Authorization: Bearer <idToken>
 */
export async function verifyFirebaseToken(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ForbiddenError("Missing or invalid Authorization header");
  }

  const idToken = authHeader.substring(7);

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error("[Firebase Auth] Token verification failed:", error);
    throw ForbiddenError("Invalid Firebase token");
  }
}

/**
 * Authenticate request using Firebase token
 * Creates/updates user in database if needed
 */
export async function authenticateFirebaseRequest(req: Request): Promise<User> {
  const firebaseUid = await verifyFirebaseToken(req);

  try {
    // Get user info from Firebase
    const firebaseUser = await auth.getUser(firebaseUid);

    // Check if user exists in database
    let user = await db.getUserByOpenId(firebaseUid);

    // If not, create new user
    if (!user) {
      await db.upsertUser({
        openId: firebaseUid,
        name: firebaseUser.displayName || null,
        email: firebaseUser.email || null,
        loginMethod: "firebase",
        lastSignedIn: new Date(),
      });
      user = await db.getUserByOpenId(firebaseUid);
    } else {
      // Update last signed in
      await db.upsertUser({
        openId: firebaseUid,
        lastSignedIn: new Date(),
      });
    }

    if (!user) {
      throw ForbiddenError("Failed to create or retrieve user");
    }

    return user;
  } catch (error) {
    console.error("[Firebase Auth] Authentication failed:", error);
    throw ForbiddenError("Firebase authentication failed");
  }
}

export { auth, firestore };
