const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const admin = require('../config/firebase');

/**
 * Synchronize user credentials and admin claims to Firebase Auth
 */
async function syncUserToFirebase(email, password = null, displayName = null, role = 'user') {
    if (!admin || !admin.apps || !admin.apps.length) return null;
    if (!email) return null;

    try {
        const cleanEmail = email.trim().toLowerCase();
        let firebaseUser = null;

        try {
            firebaseUser = await admin.auth().getUserByEmail(cleanEmail);
        } catch (e) {
            // User does not exist in Firebase Auth yet
        }

        if (!firebaseUser) {
            const createPayload = {
                email: cleanEmail,
                displayName: displayName || cleanEmail.split('@')[0],
            };
            if (password && password.length >= 6) {
                createPayload.password = password;
            }
            firebaseUser = await admin.auth().createUser(createPayload);
            console.log(`[Firebase] User registered in Firebase Auth: ${cleanEmail} (${firebaseUser.uid})`);
        }

        // Set Custom User Claims for role-based authorization
        if (firebaseUser && role) {
            await admin.auth().setCustomUserClaims(firebaseUser.uid, {
                role: role,
                admin: role === 'admin'
            });
            console.log(`[Firebase] Set custom claims for ${cleanEmail}: role=${role}`);
        }

        return firebaseUser;
    } catch (err) {
        console.warn(`[Firebase Sync Notice] ${err.message}`);
        return null;
    }
}

/**
 * Middleware to verify Admin permissions with live Database check
 */
async function verifyAdmin(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        let activeRole = req.user.role;

        // Perform live check in Supabase database so role changes to 'admin' take effect immediately!
        try {
            const { data: dbUser } = await supabase.from('users').select('id, email, username, role').eq('id', req.user.id).single();
            if (dbUser && dbUser.role) {
                activeRole = dbUser.role;
                req.user.role = dbUser.role;

                // Sync to Firebase if user is admin
                if (dbUser.role === 'admin' && dbUser.email) {
                    syncUserToFirebase(dbUser.email, null, dbUser.username, 'admin');
                }
            }
        } catch (dbErr) {
            console.debug('DB lookup fallback in verifyAdmin:', dbErr.message);
        }

        if (activeRole !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Requires Admin privileges' });
        }

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
}

module.exports = {
    verifyAdmin,
    syncUserToFirebase
};
