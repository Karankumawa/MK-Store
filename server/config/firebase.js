const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to service account key
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

if (!admin.apps.length) {
    // 1. Try FIREBASE_SERVICE_ACCOUNT environment variable (for Render / Vercel cloud deployment)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || 'mkstore-web'
            });
            console.log('Firebase Admin SDK initialized from environment variable');
        } catch (e) {
            console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT env:', e.message);
        }
    }

    // 2. Try local service account file if present
    if (!admin.apps.length && fs.existsSync(serviceAccountPath)) {
        try {
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || 'mkstore-web'
            });
            console.log('Firebase Admin SDK initialized from service account file');
        } catch (e) {
            console.warn('Failed to load local service account file:', e.message);
        }
    }

    // 3. Fallback: Initialize with Project ID for Google public token verification
    // This allows verifyIdToken to verify incoming Google tokens on any server without a secret file
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID || 'mkstore-web';
        admin.initializeApp({
            projectId: projectId
        });
        console.log(`Firebase Admin SDK initialized in public token verification mode (Project: ${projectId})`);
    }
}

module.exports = admin;
