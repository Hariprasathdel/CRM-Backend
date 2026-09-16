require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

// Connect to database
connectDB();

const createTestUser = async () => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: 'admin@crm.com' });
        if (existingUser) {
            console.log('✅ Test user already exists');
            console.log('📧 Email: admin@crm.com');
            console.log('🔑 Password: password123');
            process.exit();
        }

        // Create new user
        const user = await User.create({
            name: 'Admin User',
            email: 'admin@crm.com',
            password: 'password123',
            role: 'super_admin',
            status: 'active'
        });

        console.log('✅ Test user created successfully!');
        console.log('📧 Email: admin@crm.com');
        console.log('🔑 Password: password123');
        console.log('👤 Role: super_admin');
        process.exit();
    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        process.exit(1);
    }
};

createTestUser();