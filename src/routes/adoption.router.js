import { Router } from 'express';
import {
  getAllAdoptions,
  getAdoptionById,
  createAdoption,
  updateAdoption,
  deleteAdoption,
} from '../controllers/adoptionController.js';

const router = Router();

router.get('/', getAllAdoptions);
router.get('/:id', getAdoptionById);
router.post('/', createAdoption);
router.put('/:id', updateAdoption);
router.delete('/:id', deleteAdoption);

export default router;
