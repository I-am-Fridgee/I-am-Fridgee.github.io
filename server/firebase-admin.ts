// firebase-admin.ts
import admin from 'firebase-admin';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Use service account for proper Firestore access
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );
    
    // OR use environment variables if service account isn't available
    admin.initializeApp({
      credential: serviceAccount.private_key 
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'fridgee-casino',
    });
    
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    // Fallback to emulator for development
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Trying Firebase emulator...');
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      admin.initializeApp({ projectId: 'fridgee-casino-emulator' });
    }
  }
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const db = firestore; // Alias for consistency
export default admin;
