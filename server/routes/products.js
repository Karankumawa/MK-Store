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
            // Essentials & Groceries
            { name: "Sail Sugar (Premium)", price: 1.5, image: "assets/sail,suger&jaggery.webp", category: "Groceries", rating: 4.5 },
            { name: "Atta & Flour 5kg", price: 2.2, image: "assets/atta.webp", category: "Groceries", rating: 4.8 },
            { name: "Basmati Rice 5kg", price: 7.5, image: "assets/rice & rice product.webp", category: "Groceries", rating: 4.6 },
            { name: "Toor Dal 1kg", price: 1.8, image: "assets/Dals & Pulses.webp", category: "Groceries", rating: 4.4 },
            { name: "Sunflower Oil 1L", price: 2.0, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/edible-oil/q/n/2/-original-imagz2zyqxhz6z5q.jpeg?q=70", category: "Groceries", rating: 4.5 },
            { name: "Tata Salt 1kg", price: 0.5, image: "https://rukminim1.flixcart.com/image/612/612/kthjy4w0/salt/i/w/u/1-iodized-salt-1-tata-original-imag6tul6z6s4hgy.jpeg?q=70", category: "Groceries", rating: 4.9 },

            // Snacks
            { name: "Morning Muesli", price: 3.5, image: "assets/Morning Starters.webp", category: "Groceries", rating: 4.3 },
            { name: "Chai Time Biscuits", price: 1.2, image: "assets/Chai Snacks.webp", category: "Groceries", rating: 4.2 },
            { name: "Assorted Sweets Box", price: 6.5, image: "assets/Sweets.webp", category: "Groceries", rating: 4.9 },
            { name: "Italian Pasta 500g", price: 2.5, image: "assets/Pasta & More.webp", category: "Groceries", rating: 4.4 },
            { name: "Dark Chocolate Bar", price: 2.0, image: "https://rukminim1.flixcart.com/image/612/612/k6fd47k0/chocolate/g/z/r/150-bournville-rich-cocoa-dark-chocolate-bar-3-cadbury-original-imafzwh9f9yghz7z.jpeg?q=70", category: "Groceries", rating: 4.8 },

            // Mobiles
            { name: "iPhone 14 Pro", price: 999, image: "https://rukminim1.flixcart.com/image/312/312/xif0q/mobile/3/5/l/-original-imaghx9qmgqsk9s4.jpeg?q=70", category: "Mobiles", rating: 4.9 },
            { name: "Samsung Galaxy S23", price: 899, image: "https://rukminim1.flixcart.com/image/312/312/xif0q/mobile/2/p/8/-original-imah4ss6h8k228r5.jpeg?q=70", category: "Mobiles", rating: 4.8 },
            { name: "Redmi Note 12", price: 299, image: "https://rukminim1.flixcart.com/image/312/312/xif0q/mobile/6/x/j/-original-imagzzh8g4yq8k92.jpeg?q=70", category: "Mobiles", rating: 4.5 },
            { name: "OnePlus 11R", price: 499, image: "https://rukminim1.flixcart.com/image/312/312/xif0q/mobile/u/m/b/-original-imagz23wz5z5q8b9.jpeg?q=70", category: "Mobiles", rating: 4.7 },
            { name: "Google Pixel 7", price: 599, image: "https://rukminim1.flixcart.com/image/312/312/xif0q/mobile/n/i/d/-original-imaggsurzqrvkkzf.jpeg?q=70", category: "Mobiles", rating: 4.6 },
            { name: "Nothing Phone (1)", price: 399, image: "https://rukminim1.flixcart.com/image/312/312/l5h2xe80/mobile/5/x/r/-original-imagg4xza5rehdqv.jpeg?q=70", category: "Mobiles", rating: 4.4 },

            // Fashion
            { name: "Men's Casual Shirt", price: 25, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/shirt/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Fashion", rating: 4.2 },
            { name: "Women's Floral Dress", price: 35, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/dress/k/w/n/-original-imagnbfyghgy8x29.jpeg?q=70", category: "Fashion", rating: 4.6 },
            { name: "Running Shoes", price: 45, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/shoe/1/8/p/-original-imaggcaxggc8p8h2.jpeg?q=70", category: "Fashion", rating: 4.4 },
            { name: "Classic Blue Jeans", price: 30, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/jean/y/r/w/-original-imagz4y5z5z5q8b9.jpeg?q=70", category: "Fashion", rating: 4.3 },
            { name: "Leather Wallet", price: 15, image: "https://rukminim1.flixcart.com/image/612/612/k6fd47k0/wallet-card-wallet/h/h/p/men-s-genuine-leather-wallet-regular-size-w3-tan-w3-tan-wallet-original-imafzwh9f9yghz7z.jpeg?q=70", category: "Fashion", rating: 4.5 },

            // Electronics
            { name: "Wireless Earbuds", price: 49, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/headphone/p/r/z/enb-520-earbuds-bluetooth-headset-wireless-earbuds-earbuds-original-imagkgq5z5z5q8b9.jpeg?q=70", category: "Electronics", rating: 4.4 },
            { name: "Smart Watch Series 7", price: 199, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/smartwatch/k/h/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Electronics", rating: 4.6 },
            { name: "Laptop Stand Aluminum", price: 29, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/stand/laptop-stand/k/h/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Electronics", rating: 4.5 },
            { name: "HD Monitor 24 inch", price: 129, image: "https://rukminim1.flixcart.com/image/312/312/mouse/y/r/k/dell-ms116-wired-optical-mouse-original-imae9545guwhz2wz.jpeg?q=70", category: "Electronics", rating: 4.5 },
            { name: "Mechanical Keyboard", price: 79, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/keyboard/gaming-keyboard/k/h/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Electronics", rating: 4.8 },

            // Home
            { name: "Cotton Bedsheet Set", price: 22, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/bedsheet/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Home", rating: 4.3 },
            { name: "Ceramic Flower Vase", price: 15, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/vase/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Home", rating: 4.7 },
            { name: "Wall Clock Vintage", price: 18, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/wall-clock/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Home", rating: 4.2 },
            { name: "Soft Cushions Set", price: 25, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/cushion-pillow-cover/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Home", rating: 4.5 },

            // Appliances
            { name: "Electric Kettle 1.5L", price: 19, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/electric-kettle/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Appliances", rating: 4.5 },
            { name: "Sandwich Maker", price: 25, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/sandwich-maker/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Appliances", rating: 4.3 },
            { name: "Portable Blender", price: 15, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/blender/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Appliances", rating: 4.4 },
            { name: "Air Fryer", price: 85, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/air-fryer/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Appliances", rating: 4.7 },

            // Toys
            { name: "Action Figure Hero", price: 12, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/action-figure/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Toys", rating: 4.8 },
            { name: "Building Blocks Set", price: 20, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/block/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Toys", rating: 4.7 },
            { name: "Remote Control Car", price: 35, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/remote-control-toy/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Toys", rating: 4.6 },
            { name: "Plush Teddy Bear", price: 18, image: "https://rukminim1.flixcart.com/image/612/612/xif0q/stuffed-toy/i/i/s/-original-imaghg5gqjczf7qg.jpeg?q=70", category: "Toys", rating: 4.5 }
        ];
        await Product.insertMany(products);
        res.json({ msg: 'Products Seeded with High-Quality Images' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
