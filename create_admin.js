const bcrypt = require('bcryptjs');
const supabase = require('./server/config/supabase');

async function createAdmin() {
    try {
        const adminEmail = 'karankumawat303@gmail.com';
        const adminUser = 'karankumawat';
        const adminPass = 'karan@123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPass, salt);

        const newAdmin = {
            username: adminUser,
            email: adminEmail,
            password: hashedPassword
        };

        console.log('Inserting into admins table...');
        const { data: insertedAdmin, error } = await supabase.from('admins').insert(newAdmin).select().single();
        
        if (error) {
            console.error('Error creating admin:', error.message);
        } else {
            console.log('Admin Created Successfully!');
            console.log('Username:', insertedAdmin.username);
            console.log('Email:', insertedAdmin.email);
        }
    } catch (err) {
        console.error('Unexpected error:', err.message);
    }
}

createAdmin();
