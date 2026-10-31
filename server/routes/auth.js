const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const admin = require('../config/firebase'); // Import Firebase Admin

// Middleware to verify token and admin role
const verifyAdmin = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Admins only' });
        }
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Get All Users (Admin Only)
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase.from('users').select('id, username, email, role, google_id, address, city, zip, phone, profile_picture, created_at');
        if (error) throw error;
        
        const mappedUsers = users.map(u => ({ ...u, _id: u.id, profilePicture: u.profile_picture, googleId: u.google_id, createdAt: u.created_at }));
        res.json(mappedUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update User (Admin Only)
router.put('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { username, email, role } = req.body;
        
        const updates = {};
        if (username) updates.username = username;
        if (email) updates.email = email;
        if (role) updates.role = role;

        const { data: user, error } = await supabase.from('users')
            .update(updates)
            .eq('id', req.params.id)
            .select('id, username, email, role')
            .single();

        if (error) return res.status(404).json({ msg: 'User not found' });

        res.json({ msg: 'User updated', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete User (Admin Only)
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', req.params.id);
        if (error) return res.status(404).json({ msg: 'User not found' });
        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Register
router.post('/register', async (req, res) => {
    let { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }
        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters' });
        }

        username = username.trim();
        email = email.trim().toLowerCase();

        // Check if user already exists
        const { data: allUsers } = await supabase.from('users').select('id, email, username');
        if (allUsers && allUsers.length > 0) {
            const hasEmail = allUsers.some(u => u.email && u.email.toLowerCase() === email);
            if (hasEmail) return res.status(400).json({ msg: 'An account with this email already exists' });
            const hasUser = allUsers.some(u => u.username && u.username.toLowerCase() === username.toLowerCase());
            if (hasUser) return res.status(400).json({ msg: 'This username is already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            email,
            password: hashedPassword,
            role: 'user',
            created_at: new Date().toISOString()
        };
        
        const { data: user, error } = await supabase.from('users').insert(newUser).select('id, username, email, role').single();
        if (error) throw error;

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
        });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).json({ msg: 'Server registration error', error: err.message });
    }
});

// Login (Checks Users, then Admins)
router.post('/login', async (req, res) => {
    let { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please enter both email and password' });
        }

        email = email.trim().toLowerCase();
        let user = null;
        let role = 'user';

        // 1. Try finding in users table (case-insensitive)
        const { data: allUsers } = await supabase.from('users').select('*');
        if (allUsers) {
            const match = allUsers.find(u => u.email && u.email.toLowerCase() === email);
            if (match) {
                user = match;
                role = match.role || 'user';
            }
        }

        // 2. Try finding in admins table if not found
        if (!user) {
            const { data: allAdmins } = await supabase.from('admins').select('*');
            if (allAdmins) {
                const matchAdmin = allAdmins.find(a => a.email && a.email.toLowerCase() === email);
                if (matchAdmin) {
                    user = matchAdmin;
                    role = 'admin';
                }
            }
        }

        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id, role: role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: role } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get Current User Profile
router.get('/me', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // First attempt to find in users table
        let { data: user } = await supabase.from('users')
            .select('id, username, email, role, google_id, address, city, zip, phone, profile_picture, created_at')
            .eq('id', decoded.user.id)
            .single();

        // If not found in users, check admins table
        if (!user) {
            const { data: adminUser } = await supabase.from('admins')
                .select('id, username, email, created_at')
                .eq('id', decoded.user.id)
                .single();

            if (adminUser) {
                user = { ...adminUser, role: 'admin' };
            }
        }

        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        user._id = user.id;
        user.role = user.role || decoded.user.role || 'user';
        user.profilePicture = user.profile_picture || null;
        user.googleId = user.google_id || null;
        user.createdAt = user.created_at;
        
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(401).json({ msg: 'Token is invalid or expired' });
    }
});

// Update Current User Profile
router.put('/me', async (req, res) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { address, city, zip, phone } = req.body;
        const updates = {};
        if (address !== undefined) updates.address = address;
        if (city !== undefined) updates.city = city;
        if (zip !== undefined) updates.zip = zip;
        if (phone !== undefined) updates.phone = phone;

        // Try updating in users table first
        let { data: user } = await supabase.from('users')
            .update(updates)
            .eq('id', decoded.user.id)
            .select('id, username, email, role, google_id, address, city, zip, phone, profile_picture, created_at')
            .single();

        if (!user && decoded.user.role === 'admin') {
            return res.json({ msg: "Profile updated (Admin)", _id: decoded.user.id, role: 'admin' });
        }

        if (!user) return res.status(404).json({ msg: 'User not found' });
        
        user._id = user.id;
        user.profilePicture = user.profile_picture;
        user.googleId = user.google_id;
        user.createdAt = user.created_at;

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Google Login Verification Route
router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        if (!admin.apps.length) {
            return res.status(500).json({ msg: 'Firebase Admin not initialized.' });
        }

        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(token);
        const { email, name, picture, uid } = decodedToken;

        let { data: user } = await supabase.from('users').select('*').eq('email', email).single();

        if (user) {
            const updates = {};
            if (!user.google_id) updates.google_id = uid;
            if (!user.profile_picture && picture) updates.profile_picture = picture;
            
            if (Object.keys(updates).length > 0) {
                const { data: updatedUser } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
                user = updatedUser;
            }
        } else {
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const newUser = {
                username: name || email.split('@')[0],
                email,
                password: hashedPassword,
                role: 'user',
                google_id: uid,
                profile_picture: picture
            };
            
            const { data: insertedUser, error } = await supabase.from('users').insert(newUser).select().single();
            if (error) throw error;
            user = insertedUser;
        }

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, picture: user.profile_picture } });
        });

    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(401).json({ msg: 'Google Sign-In failed', error: err.message });
    }
});

module.exports = router;
