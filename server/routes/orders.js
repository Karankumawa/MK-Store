const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
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
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
