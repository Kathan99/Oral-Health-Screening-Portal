
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/Users'); 
require('dotenv').config(); 

const ADMIN_EMAIL = 'admin@oralvis.com';
const ADMIN_PASSWORD = 'password123';

const createAdminAccount = async () => {
 
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for admin creation...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }

  try {
    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (admin) {
      console.log('Admin user already exists.');
      return;
    }

    console.log('Admin user not found, creating a new one...');
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);


    admin = new User({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin', 
    });

   
    await admin.save();
    console.log('Admin user created successfully!');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);

  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
   
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};
createAdminAccount();