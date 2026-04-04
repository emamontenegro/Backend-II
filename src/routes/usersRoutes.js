import { Router } from "express";
import { User } from "../models/User.js";
import { login, logout, register } from "../controllers/usersController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = Router();

// Get all users
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Registred
router.post('/register', register);

// Login
router.post('/login', login);

// Logout
router.post('/logout', logout);

export default router;