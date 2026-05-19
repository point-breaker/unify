import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin initialized using Service Account environment variable.");
        } else {
            admin.initializeApp({
                projectId: process.env.VITE_FIREBASE_PROJECT_ID || "unify-86a30"
            });
            console.log("Firebase Admin initialized using default credentials and project ID.");
        }
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;
export default admin;
