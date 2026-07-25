import mongoose from 'mongoose';

const adoptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    species: {
      type: String,
      required: true,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'other'],
    },
    age: { type: Number, min: 0 },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['available', 'pending', 'adopted'],
      default: 'available',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Adoption = mongoose.model('Adoption', adoptionSchema);
