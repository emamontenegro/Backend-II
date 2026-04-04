import { User } from "../models/User.js";
import bcrypt from 'bcrypt';

// Get all users
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;  
    const exists = await User.findOne({ username });
  
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }
  
    // Hashear password
    const hashedPassword = await bcrypt.hash(password, 10);  
    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({
      message: "User created",
      user: newUser
    });
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating user" });
  }
};

// Login
export const login = async (req, res) => {
  try {
    // input validation
    const { username, password } = req.body;  
    const user = await User.findOne({ username });
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // password compare
    const isMatch = await bcrypt.compare(password, user.password);  
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    req.session.user = {
      id: user._id,
      username: user.username
    };  
    return res.status(200).json({ message: "Login successful" });  
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout
export const logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie('connect.sid'); // elimina cookie de sesión
    res.status(200).json({ message: "Logged out" });
  });
};