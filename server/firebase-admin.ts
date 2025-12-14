import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'fridgee-casino',
    });
    console.log('✅ Firebase Admin initialized with Firestore');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
}

export const auth = admin.auth();
export const db = admin.firestore(); // This connects to your (default) database
export default admin;
