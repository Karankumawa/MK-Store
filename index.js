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
            console.error('Database connection error:', error.message);
        } else {
            console.log(`Server PID: ${process.pid}`);
            const mode = (supabase.isLocal && supabase.isLocal()) ? 'Local JSON Store (server/data/store.json)' : 'Supabase';
            console.log(`Database connected successfully [${mode}].`);
        }
    })
    .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/orders', require('./server/routes/orders'));
app.use('/api/cart', require('./server/routes/cart'));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin Route Protection (Basic) - Middleware to check admin role
const verifyAdmin = (req, res, next) => {
    // This will be replaced by actual JWT verification
    next();
};

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        const fallbackPort = Number(PORT) + 1;
        console.warn(`Port ${PORT} in use, switching to port ${fallbackPort}...`);
        app.listen(fallbackPort, () => console.log(`Server running at http://localhost:${fallbackPort}`));
    } else {
        console.error('Server startup error:', err);
    }
});

module.exports = { app, server };
