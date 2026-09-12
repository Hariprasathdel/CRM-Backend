require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');

const demoAdmin = {
    name: 'CRM Administrator',
    email: 'admin@crm.com',
    password: 'password123',
    role: 'admin'
};

const seedDemoAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const existingUser = await User.findOne({ email: demoAdmin.email });
        if (existingUser) {
            console.log('Demo admin already exists; no changes were made.');
            return;
        }

        // User.create runs the schema hook that hashes the password.
        await User.create(demoAdmin);
        console.log('Demo admin created: admin@crm.com');
    } finally {
        await mongoose.disconnect();
    }
};

seedDemoAdmin().catch((error) => {
    console.error('Unable to seed demo admin:', error.message);
    process.exitCode = 1;
});
