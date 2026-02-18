const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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

        const newOrder = new Order({
            user: req.user ? req.user.id : null,
            items,
            totalAmount,
            shippingDetails
        });

        const order = await newOrder.save();
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
        const orders = await Order.find({ user: decoded.user.id }).sort({ date: -1 });
        res.json(orders);
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
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ msg: 'Order not found' });

        // Ensure user owns this order
        if (order.user.toString() !== decoded.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        // Check status
        if (order.status !== 'Processing') {
            return res.status(400).json({ msg: `Cannot cancel order with status: ${order.status}` });
        }

        order.status = 'Cancelled';
        await order.save();
        res.json(order);
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
        const user = decoded.user;

        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
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
        const user = decoded.user;

        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Requires Admin role' });
        }

        const { status } = req.body;
        if (!status) return res.status(400).json({ msg: 'Status is required' });

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid Order ID format' });
        }

        let order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        order.status = status;
        await order.save();
        res.json(order);
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
        const user = decoded.user;

        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Order not found' });

        await Order.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Order removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
