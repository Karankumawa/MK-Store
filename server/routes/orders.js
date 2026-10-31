const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

// Middleware to verify token strictly (Login is REQUIRED to place orders or manage personal orders)
const authStrict = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'Authentication required. Please sign in or register to place an order.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Invalid user session. Please sign in again.' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid or expired session. Please sign in again.' });
    }
};

// Create Order (Requires Authentication - Guest purchases blocked)
router.post('/', authStrict, async (req, res) => {
    try {
        const { items, totalAmount, shippingDetails } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ msg: 'Cannot place an order with an empty cart' });
        }

        const validTotal = parseFloat(totalAmount) || 0;
        const validShipping = shippingDetails || {};

        // Strictly bound to authenticated user's unique ID
        const newOrder = {
            user_id: req.user.id,
            items: items,
            total_amount: validTotal,
            shipping_details: validShipping,
            status: 'Processing',
            date: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        const { data: order, error } = await supabase.from('orders').insert(newOrder).select().single();
        if (error) throw error;
        
        order._id = order.id; // Compatibility
        order.shippingDetails = order.shipping_details || validShipping;
        order.totalAmount = order.total_amount != null ? order.total_amount : validTotal;
        order.date = order.date || order.created_at;
        res.json(order);
    } catch (err) {
        console.error('Create order error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Get Current User's Orders
router.get('/myorders', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Find orders for this user
        const { data: orders, error } = await supabase.from('orders')
            .select('*')
            .eq('user_id', decoded.user.id)
            .order('date', { ascending: false });
            
        if (error) throw error;
        
        const mappedOrders = (orders || []).map(o => ({
            ...o,
            _id: o.id,
            items: o.items || [],
            shippingDetails: o.shipping_details || o.shippingDetails || {},
            totalAmount: o.total_amount != null ? o.total_amount : (o.totalAmount || 0),
            date: o.date || o.created_at || new Date().toISOString(),
            status: o.status || 'Processing'
        }));
        res.json(mappedOrders);
    } catch (err) {
        console.error('Error fetching user orders:', err);
        res.status(500).send('Server Error');
    }
});

// Cancel User Order
router.put('/:id/cancel', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { data: order, error: fetchError } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
        if (fetchError || !order) return res.status(404).json({ msg: 'Order not found' });

        // Ensure user owns this order
        if (order.user_id !== decoded.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Check status
        if (order.status !== 'Processing') {
            return res.status(400).json({ msg: `Cannot cancel order with status: ${order.status}` });
        }

        const { data: updatedOrder, error: updateError } = await supabase.from('orders')
            .update({ status: 'Cancelled' })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (updateError) throw updateError;

        updatedOrder._id = updatedOrder.id;
        updatedOrder.shippingDetails = updatedOrder.shipping_details;
        updatedOrder.totalAmount = updatedOrder.total_amount;
        res.json(updatedOrder);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Orders (Admin only)
router.get('/', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { data: orders, error } = await supabase.from('orders').select('*').order('date', { ascending: false });
        if (error) throw error;

        const mappedOrders = (orders || []).map(o => ({
            ...o,
            _id: o.id,
            items: o.items || [],
            shippingDetails: o.shipping_details || o.shippingDetails || {},
            totalAmount: o.total_amount != null ? o.total_amount : (o.totalAmount || 0),
            date: o.date || o.created_at || new Date().toISOString(),
            status: o.status || 'Processing'
        }));
        res.json(mappedOrders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).send('Server Error');
    }
});

// Update Order Status (Admin only)
router.put('/:id/status', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Requires Admin role' });
        }

        const { status } = req.body;
        const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ msg: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        const { data: order, error: fetchError } = await supabase.from('orders').select('id').eq('id', req.params.id).single();
        if (fetchError || !order) return res.status(404).json({ msg: 'Order not found' });

        const { data: updatedOrder, error: updateError } = await supabase.from('orders')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (updateError) throw updateError;
        
        updatedOrder._id = updatedOrder.id;
        updatedOrder.shippingDetails = updatedOrder.shipping_details || updatedOrder.shippingDetails || {};
        updatedOrder.totalAmount = updatedOrder.total_amount != null ? updatedOrder.total_amount : (updatedOrder.totalAmount || 0);
        res.json(updatedOrder);
    } catch (err) {
        console.error('Error in PUT /api/orders/:id/status:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Session expired, please login again' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token, please login again' });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// Delete Order (Admin only)
router.delete('/:id', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { error: deleteError } = await supabase.from('orders').delete().eq('id', req.params.id);
        if (deleteError) return res.status(404).json({ msg: 'Order not found' });

        res.json({ msg: 'Order removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
