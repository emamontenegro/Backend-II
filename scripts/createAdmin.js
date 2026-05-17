import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../src/models/User.js';

const ADMIN_USERNAME = 'admin_general';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_EMAIL = 'admin_general@gmail.com';

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const existing = await User.findOne({ username: ADMIN_USERNAME });

    if (existing) {
      existing.password = hashedPassword;
      existing.role = 'admin';
      if (!existing.email) existing.email = ADMIN_EMAIL;
      await existing.save();
      console.log('✅ Admin ya existía: contraseña y rol actualizados');
      console.log(`   Usuario: ${ADMIN_USERNAME}`);
      console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
      process.exit(0);
    }

    await User.create({
      username: ADMIN_USERNAME,
      password: hashedPassword,
      email: ADMIN_EMAIL,
      role: 'admin'
    });

    console.log('✅ Admin creado con éxito');
    console.log(`   Usuario: ${ADMIN_USERNAME}`);
    console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
