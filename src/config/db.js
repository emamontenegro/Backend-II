import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🟢 MongoDB conectado");
  } catch (error) {
    console.error("🔴 Error conectando a MongoDB:", error.message);
    process.exit(1); // corta la app si falla
  }
};

export default connectDB;