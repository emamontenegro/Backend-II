import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      username: 'admin_general',
      password: hashedPassword,
      email: 'admin_general@gmail.com',
      role: 'admin'
    });

    console.log('✅ Admin creado con éxito');
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();