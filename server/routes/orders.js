const express = require('express');
const router = express.Router();
console.log('DEBUG: Orders router file loading...');
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
    console.log('--- Order Status Update Request Received ---');
    const token = req.header('x-auth-token');
    console.log('ID Params:', req.params.id);
    console.log('Token Header Present:', !!token);

    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        console.log('Verifying JWT Token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = decoded.user;
        console.log('User Role:', user.role);

        if (user.role !== 'admin') {
            console.log('Access Denied: Not an admin');
            return res.status(403).json({ msg: 'Access denied: Requires Admin role' });
        }

        const { status } = req.body;
        console.log('Status to Update:', status);
        if (!status) return res.status(400).json({ msg: 'Status is required' });

        console.log('Validating ObjectId...');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.log('Invalid ID format');
            return res.status(400).json({ msg: 'Invalid Order ID format' });
        }

        console.log('Finding Order in DB...');
        let order = await Order.findById(req.params.id);
        if (!order) {
            console.log('Order not found');
            return res.status(404).json({ msg: 'Order not found' });
        }

        console.log('Saving new status...');
        order.status = status;
        await order.save();
        console.log('Update Successful');
        res.json(order);
    } catch (err) {
        console.error('CRITICAL ERROR in Update Status:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Session expired, please login again' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token, please login again' });
        }
        res.status(500).json({ msg: 'Server Error', error: err.message, stack: err.stack });
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
