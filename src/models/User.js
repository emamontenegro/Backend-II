import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  email: { type: String, unique: true, sparse: true },
  googleSubjectId: {
    type: String,
    unique: true,
    sparse: true
  },
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' // Por defecto son usuarios comunes
  }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);