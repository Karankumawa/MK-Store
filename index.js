require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./server/config/supabase');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection Check
supabase.from('products').select('id').limit(1)
    .then(({ error }) => {
        if (error) {
            console.error('Supabase connection error:', error.message);
        } else {
            console.log(`Server PID: ${process.pid}`);
            console.log(`Supabase Connected successfully.`);
        }
    })
    .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/orders', require('./server/routes/orders'));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin Route Protection (Basic) - Middleware to check admin role
const verifyAdmin = (req, res, next) => {
    // This will be replaced by actual JWT verification
    next();
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
