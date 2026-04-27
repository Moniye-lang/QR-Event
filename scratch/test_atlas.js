const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.local' });
const MONGO_URI = process.env.MONGO_URI;

async function test() {
  try {
    console.log('Attempting to connect to Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

test();
