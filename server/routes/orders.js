const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

// Middleware to verify token (optional for creation, required for viewing)
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return next(); // Proceed as guest if no token

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        // Invalid token - proceed as guest or error? 
        // For order creation, we allow guest. For viewing, we need strict check.
        next();
    }
};

// Create Order
router.post('/', auth, async (req, res) => {
    try {
        const { items, totalAmount, shippingDetails } = req.body;

        const newOrder = {
            user_id: req.user ? req.user.id : null,
            items: items,
            total_amount: totalAmount,
            shipping_details: shippingDetails
        };

        const { data: order, error } = await supabase.from('orders').insert(newOrder).select().single();
        if (error) throw error;
        
        order._id = order.id; // Compatibility
        order.shippingDetails = order.shipping_details;
        order.totalAmount = order.total_amount;
        res.json(order);
    } catch (err) {
        console.error(err.message);
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
        
        const mappedOrders = orders.map(o => ({ ...o, _id: o.id, shippingDetails: o.shipping_details, totalAmount: o.total_amount }));
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

        const mappedOrders = orders.map(o => ({ ...o, _id: o.id, shippingDetails: o.shipping_details, totalAmount: o.total_amount }));
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
        if (!status) return res.status(400).json({ msg: 'Status is required' });

        const { data: order, error: fetchError } = await supabase.from('orders').select('id').eq('id', req.params.id).single();
        if (fetchError || !order) return res.status(404).json({ msg: 'Order not found' });

        const { data: updatedOrder, error: updateError } = await supabase.from('orders')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();
            
        if (updateError) throw updateError;
        
        updatedOrder._id = updatedOrder.id;
        updatedOrder.shippingDetails = updatedOrder.shipping_details;
        updatedOrder.totalAmount = updatedOrder.total_amount;
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
