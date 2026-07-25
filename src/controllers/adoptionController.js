import mongoose from 'mongoose';
import { Adoption } from '../models/Adoption.js';

export const getAllAdoptions = async (req, res) => {
  try {
    const adoptions = await Adoption.find();
    res.json({ adoptions });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener adopciones', error: error.message });
  }
};

export const getAdoptionById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  try {
    const adoption = await Adoption.findById(id);
    if (!adoption) {
      return res.status(404).json({ message: 'Adopción no encontrada' });
    }
    res.json({ adoption });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener adopción', error: error.message });
  }
};

export const createAdoption = async (req, res) => {
  const { name, species } = req.body;
  if (!name || !species) {
    return res.status(400).json({ message: 'Los campos name y species son requeridos' });
  }
  try {
    const adoption = await Adoption.create(req.body);
    res.status(201).json({ message: 'Adopción creada', adoption });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear adopción', error: error.message });
  }
};

export const updateAdoption = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  try {
    const adoption = await Adoption.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!adoption) {
      return res.status(404).json({ message: 'Adopción no encontrada' });
    }
    res.json({ message: 'Adopción actualizada', adoption });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar adopción', error: error.message });
  }
};

export const deleteAdoption = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  try {
    const adoption = await Adoption.findByIdAndDelete(id);
    if (!adoption) {
      return res.status(404).json({ message: 'Adopción no encontrada' });
    }
    res.json({ message: 'Adopción eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar adopción', error: error.message });
  }
};
