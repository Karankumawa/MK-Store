const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const products = [
    // Groceries (3)
    {
        name: "Organic Raw Wildflower Honey (500g)",
        category: "Groceries",
        price: 12.99,
        rating: 4.9,
        image: "assets/products/honey.png",
        description: "100% pure, unfiltered organic wildflower honey sustainably harvested from pristine apiaries. Rich in natural antioxidants and enzymes with a smooth, floral sweetness.",
        details: {
            "Weight": "500g",
            "Ingredients": "100% Pure Raw Honey",
            "Certifications": "USDA Organic, Non-GMO",
            "Shelf Life": "24 Months",
            "Origin": "Himalayan Foothills"
        }
    },
    {
        name: "Artisan Arabica Roast Coffee Beans (250g)",
        category: "Groceries",
        price: 14.50,
        rating: 4.8,
        image: "assets/products/coffee.png",
        description: "Single-origin shade-grown Arabica beans roasted in small batches to a medium-dark perfection. Delivers subtle notes of dark cocoa, roasted hazelnut, and sweet caramel.",
        details: {
            "Weight": "250g",
            "Bean Type": "100% Arabica",
            "Roast Level": "Medium-Dark",
            "Aroma Notes": "Dark Chocolate, Hazelnut",
            "Origin": "Coorg, India"
        }
    },
    {
        name: "Royal Aged Basmati Rice (5kg)",
        category: "Groceries",
        price: 18.99,
        rating: 4.7,
        image: "assets/products/rice.png",
        description: "Extra-long grain authentic Himalayan basmati rice naturally aged for two years. Yields non-sticky, fluffy grains with an intoxicating natural nutty aroma when cooked.",
        details: {
            "Weight": "5 kg",
            "Aging Period": "24 Months",
            "Grain Length": "8.4 mm Average",
            "Purity": "100% Traditional Basmati",
            "Origin": "Punjab, India"
        }
    },

    // Mobiles (3)
    {
        name: "Apple iPhone 15 Pro (256GB - Titanium)",
        category: "Mobiles",
        price: 1099.00,
        rating: 4.9,
        image: "assets/products/iphone.png",
        description: "Forged in aerospace-grade titanium with the groundbreaking A17 Pro chip. Features a customizable Action button, 48MP Pro camera system, and USB-C connectivity with USB 3 speeds.",
        details: {
            "Display": "6.1-inch Super Retina XDR OLED 120Hz",
            "Processor": "Apple A17 Pro (3nm)",
            "Storage": "256GB NVMe",
            "Camera": "48MP Main + 12MP Ultra-Wide + 12MP 3x Telephoto",
            "Battery": "All-day battery life, MagSafe Fast Charge"
        }
    },
    {
        name: "Samsung Galaxy S24 Ultra (512GB)",
        category: "Mobiles",
        price: 1199.00,
        rating: 4.9,
        image: "assets/products/samsung.png",
        description: "The pinnacle of Android engineering with Galaxy AI integration, titanium frame, built-in S-Pen, and an astonishing 200MP Quad Telephoto camera with 100x Space Zoom.",
        details: {
            "Display": "6.8-inch Dynamic AMOLED 2X QHD+ 120Hz",
            "Processor": "Snapdragon 8 Gen 3 for Galaxy",
            "Storage & RAM": "512GB UFS 4.0, 12GB LPDDR5X",
            "Camera": "200MP + 50MP 5x + 10MP 3x + 12MP Ultra-Wide",
            "Battery": "5000 mAh with 45W Fast Charging"
        }
    },
    {
        name: "Nothing Phone (2) (12GB + 256GB - Dark Grey)",
        category: "Mobiles",
        price: 649.00,
        rating: 4.7,
        image: "assets/products/nothing.png",
        description: "Innovative transparent design with redesigned Glyph interface lighting for silent notifications. Powered by Snapdragon 8+ Gen 1 and a fluid 120Hz LTPO AMOLED display.",
        details: {
            "Display": "6.7-inch Flexible LTPO OLED 1-120Hz",
            "Processor": "Qualcomm Snapdragon 8+ Gen 1",
            "Storage & RAM": "256GB Storage, 12GB RAM",
            "Camera": "Dual 50MP Sony IMX890 OIS + 50MP Samsung JN1",
            "OS": "Nothing OS 2.5 (Clean, No Bloatware)"
        }
    },

    // Fashion (3)
    {
        name: "Classic Oxford Cotton Slim Fit Shirt",
        category: "Fashion",
        price: 39.99,
        rating: 4.6,
        image: "assets/products/shirt.png",
        description: "Tailored from 100% premium long-staple cotton for breathable comfort. Features mother-of-pearl buttons, a modern spread collar, and reinforced dual-stitched seams.",
        details: {
            "Material": "100% Combed Cotton Oxford",
            "Fit": "Modern Slim Fit",
            "Collar": "Button-Down Spread Collar",
            "Care": "Machine wash cold, tumble dry low",
            "Occasion": "Business Casual & Everyday Wear"
        }
    },
    {
        name: "Airstride Pro Breathable Running Sneakers",
        category: "Fashion",
        price: 79.99,
        rating: 4.8,
        image: "assets/products/shoes.png",
        description: "Engineered mesh upper for maximum breathability with high-rebound EVA foam midsoles that absorb shock and propel your stride forward on roads and tracks.",
        details: {
            "Upper": "Seamless Jacquard Engineered Mesh",
            "Midsole": "High-Density Energy Foam",
            "Outsole": "Anti-Slip Carbon Rubber Tread",
            "Weight": "240g (Size 9)",
            "Usage": "Marathon, Daily Running & Gym"
        }
    },
    {
        name: "Chronograph Minimalist Sapphire Watch",
        category: "Fashion",
        price: 129.00,
        rating: 4.8,
        image: "assets/products/watch.png",
        description: "Sleek 316L stainless steel case housing a scratch-proof sapphire crystal dial. Equipped with high-precision Japanese quartz movement and an interchangeable Italian leather strap.",
        details: {
            "Case Diameter": "40 mm",
            "Glass": "Anti-Reflective Sapphire Crystal",
            "Water Resistance": "5 ATM (50 Meters / 165 Feet)",
            "Movement": "Japanese Miyota Quartz Chronograph",
            "Strap": "Top-Grain Italian Calfskin Leather"
        }
    },

    // Electronics (3)
    {
        name: "ProSound ANC True Wireless Earbuds",
        category: "Electronics",
        price: 89.99,
        rating: 4.8,
        image: "assets/products/earbuds.png",
        description: "Hybrid active noise cancellation filters out up to 40dB of ambient noise. 11mm bio-cellulose drivers deliver deep bass and sparkling highs with 36 hours total battery life.",
        details: {
            "Battery Life": "8h Earbuds + 28h Wireless Charging Case",
            "Noise Cancellation": "Hybrid ANC up to 40dB + Transparency Mode",
            "Connectivity": "Bluetooth 5.3 with Multipoint Connect",
            "Water Resistance": "IPX5 Sweat & Rain Proof",
            "Microphones": "6 Mics with AI Environmental Noise Reduction"
        }
    },
    {
        name: "RGB Wireless Mechanical Gaming Keyboard",
        category: "Electronics",
        price: 99.00,
        rating: 4.7,
        image: "assets/products/keyboard.png",
        description: "Compact 75% layout with hot-swappable custom lubricated switches, sound-dampening silicone foam, per-key RGB backlighting, and tri-mode wireless connectivity.",
        details: {
            "Layout": "75% Compact (82 Keys + Aluminum Volume Knob)",
            "Switches": "Hot-Swappable Gateron Pro Yellow (Linear)",
            "Connectivity": "Bluetooth 5.1 / 2.4GHz Wireless / USB-C",
            "Battery": "4000 mAh Rechargeable (up to 200h without RGB)",
            "Keycaps": "Double-Shot PBT Cherry Profile"
        }
    },
    {
        name: "UltraView 27\" 4K IPS HDR Monitor",
        category: "Electronics",
        price: 349.99,
        rating: 4.9,
        image: "assets/products/monitor.png",
        description: "Stunning 3840x2160 UHD resolution with 99% sRGB color gamut and HDR400 certification. Includes single-cable USB-C with 65W power delivery for seamless laptop docking.",
        details: {
            "Screen Size & Res": "27-inch 4K UHD (3840 x 2160) IPS",
            "Refresh Rate": "144 Hz with AMD FreeSync Premium",
            "Color Coverage": "99% sRGB, 95% DCI-P3, HDR400",
            "Ports": "1x USB-C (65W PD), 2x HDMI 2.1, 1x DP 1.4, USB Hub",
            "Stand": "Full Ergonomic (Height, Tilt, Swivel, Pivot)"
        }
    },

    // Home (3)
    {
        name: "Nordic Floating Minimalist Wall Clock",
        category: "Home",
        price: 34.50,
        rating: 4.7,
        image: "assets/products/clock.png",
        description: "Quiet sweep quartz movement ensures a peaceful environment without ticking noises. Crafted with natural birch wood grain and sleek Scandinavian minimalist numerals.",
        details: {
            "Diameter": "12 Inches (30 cm)",
            "Material": "Natural Birch Wood & Matte ABS",
            "Movement": "Silent Non-Ticking Quartz Mechanism",
            "Power": "1x AA Carbon Zinc Battery",
            "Mounting": "Built-in Keyhole Slot with Hardware Included"
        }
    },
    {
        name: "Ultrasonic Ceramic Aromatherapy Diffuser",
        category: "Home",
        price: 44.99,
        rating: 4.8,
        image: "assets/products/diffuser.png",
        description: "Handcrafted matte ceramic cover with whisper-quiet ultrasonic technology to gently disperse essential oils throughout your home. Features ambient warm LED illumination.",
        details: {
            "Capacity": "200 ml (Covers up to 300 sq. ft.)",
            "Run Time": "Up to 8 Hours Continuous / 14 Hours Intermittent",
            "Material": "Handmade Stone Ceramic & BPA-Free Reservoir",
            "Lighting": "Warm Ambient Glow with Breathing Light Mode",
            "Safety": "Waterless Automatic Shut-Off"
        }
    },
    {
        name: "Handcrafted Geometric Ceramic Flower Vase",
        category: "Home",
        price: 29.99,
        rating: 4.6,
        image: "assets/products/vase.png",
        description: "Modern sculptural ceramic vase with a textured matte chalk finish. Ideal as an artistic decorative statement piece or for showcasing fresh floral and dried pampas grass arrangements.",
        details: {
            "Dimensions": "9.5\" H x 5.2\" W",
            "Material": "High-Fired Premium Kaolin Clay Ceramic",
            "Finish": "Textured Matte Glaze",
            "Waterproof": "Fully Glazed Interior for Fresh Floral Water",
            "Style": "Modern Bohemian & Japandi Aesthetic"
        }
    },

    // Appliances (3)
    {
        name: "Smart Digital 6.5L Air Fryer Pro",
        category: "Appliances",
        price: 119.00,
        rating: 4.9,
        image: "assets/products/airfryer.png",
        description: "Rapid 360° thermo-circulation technology fries food with up to 85% less oil while locking in natural juiciness. One-touch digital touchscreen with 8 chef-curated presets.",
        details: {
            "Capacity": "6.5 Liters (Cooks for 4-6 People)",
            "Power": "1700W High-Efficiency Rapid Heating",
            "Temperature Range": "100°F - 400°F (40°C - 200°C)",
            "Basket": "Non-Stick, PFOA-Free, Dishwasher-Safe",
            "Presets": "Fry, Roast, Bake, Dehydrate, Reheat & Defrost"
        }
    },
    {
        name: "High-Speed Commercial Grade Blender (1200W)",
        category: "Appliances",
        price: 89.99,
        rating: 4.8,
        image: "assets/products/blender.png",
        description: "Heavy-duty 1200-watt pure copper motor powers 6 hardened Japanese stainless steel blades to pulverize ice, frozen fruit, and whole nuts into silky smoothies in seconds.",
        details: {
            "Motor Power": "1200W Peak, 28,000 RPM",
            "Jar Capacity": "2.0 Liters (BPA-Free Tritan Pitcher)",
            "Blades": "6-Point Aircraft-Grade Stainless Steel",
            "Controls": "Variable 10-Speed Dial + Pulse Function",
            "Warranty": "2 Years Manufacturer Warranty"
        }
    },
    {
        name: "Precision Temperature Gooseneck Electric Kettle",
        category: "Appliances",
        price: 69.99,
        rating: 4.8,
        image: "assets/products/kettle.png",
        description: "Engineered for pour-over coffee and delicate tea enthusiasts. Slender ergonomic gooseneck spout gives pinpoint water-flow control with 1°F precise temperature holding for 60 minutes.",
        details: {
            "Capacity": "1.0 Liter (Fast Boil in 3-4 Minutes)",
            "Material": "100% Food-Grade 304 Stainless Steel (No Plastic Inside)",
            "Temp Range": "104°F - 212°F (40°C - 100°C)",
            "Display": "High-Definition LCD Real-Time Display",
            "Features": "Keep Warm Function, Boil-Dry Auto Shut-Off"
        }
    },

    // Toys (3)
    {
        name: "Creative Modular Magnetic Building Blocks (120 Pcs)",
        category: "Toys",
        price: 36.99,
        rating: 4.9,
        image: "assets/products/blocks.png",
        description: "Engaging STEM construction toy featuring 120 ultra-strong magnetic geometric tiles. Encourages spatial thinking, architectural creativity, and hours of cooperative screen-free play.",
        details: {
            "Pieces": "120 Magnetic Tiles (Squares, Triangles, Windows & Wheels)",
            "Material": "Heavy-Duty Food-Grade ABS Plastic with Rounded Edges",
            "Magnets": "Reinforced Rare-Earth Neodymium Magnets",
            "Age Group": "Ages 3+ (Safe & Non-Toxic Certified)",
            "Includes": "Storage Travel Bag + Idea Guide Booklet"
        }
    },
    {
        name: "High-Speed 4WD All-Terrain RC Monster Truck",
        category: "Toys",
        price: 59.99,
        rating: 4.7,
        image: "assets/products/rc_car.png",
        description: "Blistering 35 km/h top speed powered by a dual high-torque brushed motor and oil-filled metal shocks. Conquer mud, grass, sand, and asphalt effortlessly with 2.4GHz proportional control.",
        details: {
            "Scale & Drive": "1:16 Scale Full 4-Wheel Drive (4WD)",
            "Top Speed": "35+ km/h (22+ mph)",
            "Remote Range": "Up to 80 Meters (2.4GHz Anti-Interference)",
            "Batteries": "2x 7.4V 1200mAh Li-Po (40+ Mins Total Run Time)",
            "Suspension": "Independent Metal Spring Shock Absorbers"
        }
    },
    {
        name: "Deluxe 1000-Piece Panoramic Wooden Jigsaw Puzzle",
        category: "Toys",
        price: 24.99,
        rating: 4.8,
        image: "assets/products/puzzle.png",
        description: "Laser-cut high-density basswood puzzle featuring intricate interlocking shapes and anti-glare museum-quality matte print. Comes in a collector's gift box with a full-size reference poster.",
        details: {
            "Piece Count": "1000 Pieces",
            "Completed Dimensions": "29.5\" x 19.7\" (75 x 50 cm)",
            "Material": "Natural Eco-Friendly Layered Basswood",
            "Print Quality": "Ultra-Vivid UV Curable Non-Fade Ink",
            "Bonus": "Full-Size Color Poster + Resealable Storage Bag"
        }
    }
];

async function seed() {
    console.log('Seeding products...');
    
    // 1. Update local store.json
    const storePath = path.join(__dirname, '..', 'server', 'data', 'store.json');
    let localDb = { users: [], products: [], orders: [] };
    if (fs.existsSync(storePath)) {
        try {
            localDb = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        } catch(e) {}
    }

    const crypto = require('crypto');
    const preparedProducts = products.map((p, idx) => ({
        id: p.id || crypto.randomUUID(),
        ...p
    }));

    localDb.products = preparedProducts;
    fs.writeFileSync(storePath, JSON.stringify(localDb, null, 2), 'utf8');
    console.log(`[Local DB] Successfully saved ${preparedProducts.length} products to store.json.`);

    // 2. Insert into Supabase if credentials present
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY;

    if (supabaseUrl && supabaseKey) {
        try {
            const client = createClient(supabaseUrl, supabaseKey);
            
            // Delete existing products if any
            const { error: delError } = await client.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (delError) console.warn('Note on delete:', delError.message);

            // Filter columns supported by Supabase products table (id, name, price, image, category, rating)
            const supabaseRows = preparedProducts.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.image,
                category: p.category,
                rating: p.rating
            }));

            const { data, error } = await client.from('products').insert(supabaseRows).select();
            if (error) {
                console.error('[Supabase] Failed to insert products:', error.message);
            } else {
                console.log(`[Supabase] Successfully seeded ${data ? data.length : 0} products into Supabase.`);
            }
        } catch (err) {
            console.error('[Supabase Error]:', err.message);
        }
    }
}

seed();
