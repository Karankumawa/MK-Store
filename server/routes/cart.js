const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

// Strict Auth Middleware - each user has their isolated cart
const authStrict = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'Authentication required. Please sign in to access your cart.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Invalid token payload' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Session expired or invalid token' });
    }
};

// Get current user's isolated cart
router.get('/', authStrict, async (req, res) => {
    try {
        const { data: carts, error } = await supabase.from('carts').select('*').eq('user_id', req.user.id);
        if (error) throw error;

        const userCart = carts && carts.length > 0 ? (carts[0].items || []) : [];
        res.json({ items: userCart });
    } catch (err) {
        console.error('Fetch user cart error:', err.message);
        res.status(500).json({ msg: 'Server error retrieving cart', error: err.message });
    }
});

// Save or sync current user's isolated cart
router.post('/', authStrict, async (req, res) => {
    try {
        const { items } = req.body;
        const validItems = Array.isArray(items) ? items : [];

        // Check if a cart row already exists for this unique user_id
        const { data: existingCarts, error: fetchErr } = await supabase.from('carts').select('*').eq('user_id', req.user.id);
        if (fetchErr) throw fetchErr;

        if (existingCarts && existingCarts.length > 0) {
            const { data: updatedCart, error: updateErr } = await supabase.from('carts')
                .update({ items: validItems, updated_at: new Date().toISOString() })
                .eq('user_id', req.user.id)
                .select()
                .single();
            if (updateErr) throw updateErr;
            return res.json({ items: updatedCart ? updatedCart.items : validItems });
        } else {
            const newCartRow = {
                user_id: req.user.id,
                items: validItems,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data: insertedCart, error: insertErr } = await supabase.from('carts').insert(newCartRow).select().single();
            if (insertErr) throw insertErr;
            return res.json({ items: insertedCart ? insertedCart.items : validItems });
        }
    } catch (err) {
        console.error('Save user cart error:', err.message);
        res.status(500).json({ msg: 'Server error saving cart', error: err.message });
    }
});

// Clear current user's cart
router.delete('/', authStrict, async (req, res) => {
    try {
        await supabase.from('carts').delete().eq('user_id', req.user.id);
        res.json({ msg: 'Cart cleared successfully', items: [] });
    } catch (err) {
        console.error('Clear user cart error:', err.message);
        res.status(500).json({ msg: 'Server error clearing cart' });
    }
});

module.exports = router;
