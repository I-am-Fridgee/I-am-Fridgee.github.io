import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // In production, use service account from environment variable
  // For now, we'll use the simpler approach with project ID
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    console.warn('FIREBASE_PROJECT_ID not set. Firebase Admin will not be initialized.');
  } else {
    try {
      admin.initializeApp({
        projectId,
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  }
}

export const auth = admin.auth();
export default admin;
