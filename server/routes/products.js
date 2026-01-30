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
            // Groceries (5)
            { name: "Premium White Sugar", price: 1.5, image: "assets/products/sugar.png", category: "Groceries", rating: 4.5 },
            { name: "Organic Atta 5kg", price: 2.2, image: "assets/products/atta.png", category: "Groceries", rating: 4.8 },
            { name: "Basmati Rice 5kg", price: 7.5, image: "assets/products/rice.png", category: "Groceries", rating: 4.6 },
            { name: "Toor Dal 1kg", price: 1.8, image: "assets/products/dal.png", category: "Groceries", rating: 4.4 },
            { name: "Sunflower Oil 1L", price: 2.0, image: "assets/products/oil.png", category: "Groceries", rating: 4.5 },

            // Mobiles (5)
            { name: "iPhone 14 Pro", price: 999, image: "assets/products/iphone.png", category: "Mobiles", rating: 4.9 },
            { name: "Samsung Galaxy S23", price: 899, image: "assets/products/samsung.png", category: "Mobiles", rating: 4.8 },
            { name: "Redmi Note 12", price: 299, image: "assets/products/redmi_note_12.png", category: "Mobiles", rating: 4.5 },
            { name: "OnePlus 11R", price: 499, image: "assets/products/oneplus.png", category: "Mobiles", rating: 4.7 },
            { name: "Nothing Phone (1)", price: 399, image: "assets/products/nothing.png", category: "Mobiles", rating: 4.4 },

            // Fashion (5)
            { name: "Men's Casual Shirt", price: 25, image: "assets/products/shirt.png", category: "Fashion", rating: 4.2 },
            { name: "Women's Floral Dress", price: 35, image: "assets/products/dress.png", category: "Fashion", rating: 4.6 },
            { name: "Running Shoes", price: 45, image: "assets/products/shoes.png", category: "Fashion", rating: 4.4 },
            { name: "Classic Blue Jeans", price: 30, image: "assets/products/jeans.png", category: "Fashion", rating: 4.3 },
            { name: "Leather Wallet", price: 15, image: "assets/products/wallet.png", category: "Fashion", rating: 4.5 },

            // Electronics (5)
            { name: "Wireless Earbuds", price: 49, image: "assets/products/earbuds.png", category: "Electronics", rating: 4.4 },
            { name: "Smart Watch", price: 199, image: "assets/products/watch.png", category: "Electronics", rating: 4.6 },
            { name: "Laptop Stand", price: 29, image: "assets/products/stand.png", category: "Electronics", rating: 4.5 },
            { name: "HD Monitor 24 inch", price: 129, image: "assets/products/monitor.png", category: "Electronics", rating: 4.5 },
            { name: "Mechanical Keyboard", price: 79, image: "assets/products/keyboard.png", category: "Electronics", rating: 4.8 },

            // Home (5)
            { name: "Cotton Bedsheet Set", price: 22, image: "assets/products/bedsheet.png", category: "Home", rating: 4.3 },
            { name: "Ceramic Flower Vase", price: 15, image: "assets/products/vase.png", category: "Home", rating: 4.7 },
            { name: "Wall Clock Vintage", price: 18, image: "assets/products/clock.png", category: "Home", rating: 4.2 },
            { name: "Soft Cushions Set", price: 25, image: "assets/products/cushion.png", category: "Home", rating: 4.5 },
            { name: "Aroma Diffuser", price: 35, image: "assets/products/diffuser.png", category: "Home", rating: 4.6 },

            // Appliances (5)
            { name: "Electric Kettle 1.5L", price: 19, image: "assets/products/kettle.png", category: "Appliances", rating: 4.5 },
            { name: "Sandwich Maker", price: 25, image: "assets/products/sandwich.png", category: "Appliances", rating: 4.3 },
            { name: "Portable Blender", price: 15, image: "assets/products/blender.png", category: "Appliances", rating: 4.4 },
            { name: "Air Fryer", price: 85, image: "assets/products/airfryer.png", category: "Appliances", rating: 4.7 },
            { name: "Coffee Maker", price: 45, image: "assets/products/coffee.png", category: "Appliances", rating: 4.6 },

            // Toys (5)
            { name: "Action Figure Hero", price: 12, image: "assets/products/toy_hero.png", category: "Toys", rating: 4.8 },
            { name: "Building Blocks Set", price: 20, image: "assets/products/blocks.png", category: "Toys", rating: 4.7 },
            { name: "Remote Control Car", price: 35, image: "assets/products/rc_car.png", category: "Toys", rating: 4.6 },
            { name: "Plush Teddy Bear", price: 18, image: "assets/products/teddy.png", category: "Toys", rating: 4.5 },
            { name: "Classic Puzzle Set", price: 10, image: "assets/products/puzzle.png", category: "Toys", rating: 4.4 }
        ];
        await Product.insertMany(products);
        res.json({ msg: 'Database standardizing to 5 products per category with local images.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
