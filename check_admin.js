require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const user = await User.findOne({ email: 'karankumawat303@gmail.com' });
        if (user) {
            console.log('Admin user found:', user.email);
            console.log('Role:', user.role);
        } else {
            console.log('Admin user NOT found');
        }
        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
