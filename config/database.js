const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const rawUri = process.env.MONGODB_URI;

  if (!rawUri || !rawUri.trim()) {
    console.error('❌ MONGODB_URI is not set in your .env file!');
    console.error('👉 Please set MONGODB_URI in crm-backend/.env (e.g. mongodb+srv://... or mongodb://127.0.0.1:27017/crm)');
    throw new Error('MONGODB_URI is not set. Add it to your .env file.');
  }

  const uri = rawUri.trim();

  try {
    // Set up connection event listeners once
    if (!mongoose.connection.listenerCount('error')) {
      mongoose.connection.on('error', (err) => {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Retrying connection...');
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
        isConnected = true;
      });
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('\n❌ ================= MONGODB CONNECTION FAILED =================');
    console.error(`Reason: ${error.message}`);
    console.error('\n🛠️ Troubleshooting Tips:');
    console.error('1. Check if your current IP address is whitelisted in MongoDB Atlas Network Access.');
    console.error('   -> Go to cloud.mongodb.com -> Security -> Network Access -> Add IP Address (or 0.0.0.0/0 for testing).');
    console.error('2. Check your internet connection.');
    console.error('3. Check your database username & password in crm-backend/.env.');
    console.error('=================================================================\n');
    throw error;
  }
};

module.exports = connectDB;

