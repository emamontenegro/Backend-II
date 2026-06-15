import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  if (!process.env.MONGO_URI?.trim()) {
    logger.warn('MONGO_URI no definida — /config OK; auth API requiere MongoDB');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB conectado');
  } catch (error) {
    logger.error('Error conectando a MongoDB', { error: error.message });
    process.exit(1);
  }
};

export default connectDB;
