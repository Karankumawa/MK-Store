const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Get All Products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Seed Products (One-time use to populate DB)
router.post('/seed', async (req, res) => {
    try {
        await Product.deleteMany({}); // Clear existing
        const products = [
            { name: "Sail Sugar (Premium)", price: 1.5, image: "assets/sail,suger&jaggery.webp", category: "Essentials" },
            { name: "Atta & Flour", price: 2.2, image: "assets/atta.webp", category: "Essentials" },
            { name: "Basmati Rice", price: 3.5, image: "assets/rice & rice product.webp", category: "Essentials" },
            { name: "Morning Muesli", price: 3.0, image: "assets/Morning Starters.webp", category: "Snacks" },
            { name: "Chai Time Snacks", price: 1.8, image: "assets/Chai Snacks.webp", category: "Snacks" },
            { name: "Assorted Sweets", price: 6.5, image: "assets/Sweets.webp", category: "Sweets" },
            { name: "Italian Pasta", price: 4.2, image: "assets/Pasta & More.webp", category: "Snacks" },
            { name: "Dals & Pulses", price: 4.8, image: "assets/Dals & Pulses.webp", category: "Essentials" }
        ];
        await Product.insertMany(products);
        res.json({ msg: 'Products Seeded with High-Quality Images' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
