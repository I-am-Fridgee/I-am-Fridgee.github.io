import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { auth as adminAuth } from "../firebase-admin";

class FirebaseSDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  /**
   * Authenticate request using Firebase ID token from Authorization header
   * or from cookie
   */
  async authenticateRequest(req: Request): Promise<User> {
    // Try to get token from Authorization header first
    let idToken: string | null = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      idToken = authHeader.substring(7);
    }
    
    // Fallback to cookie
    if (!idToken) {
      const cookies = this.parseCookies(req.headers.cookie);
      idToken = cookies.get(COOKIE_NAME) || null;
    }

    if (!idToken) {
      throw ForbiddenError("No authentication token provided");
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      const firebaseUid = decodedToken.uid;
      const email = decodedToken.email || null;
      const name = decodedToken.name || decodedToken.email?.split('@')[0] || 'Player';
      
      const signedInAt = new Date();
      
      // Check if user exists in database
      let user = await db.getUserByOpenId(firebaseUid);

      // If user not in DB, create them
      if (!user) {
        await db.upsertUser({
          openId: firebaseUid,
          name,
          email,
          loginMethod: 'firebase',
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(firebaseUid);
      } else {
        // Update last signed in
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: signedInAt,
        });
      }

      if (!user) {
        throw ForbiddenError("Failed to create or retrieve user");
      }

      return user;
    } catch (error: any) {
      console.error("[Firebase Auth] Token verification failed:", error.message);
      throw ForbiddenError("Invalid authentication token");
    }
  }
}

export const firebaseSdk = new FirebaseSDKServer();
