import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // For production (Render), use the project ID from environment
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    console.warn('FIREBASE_PROJECT_ID not set. Firebase Admin will not be initialized.');
  } else {
    try {
      // For server environments, we need proper service account credentials
      // Render automatically provides GOOGLE_APPLICATION_CREDENTIALS
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
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
