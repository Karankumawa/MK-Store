const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to service account key
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

// Check if service account file exists
if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK initialized');
} else {
    console.warn('WARNING: Firebase Service Account Key not found at ' + serviceAccountPath);
    console.warn('Google Sign-In verification on backend will fail until this file is added.');
}

module.exports = admin;
