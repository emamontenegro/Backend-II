import { User } from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const CURRENT_USER_COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  signed: true,
  sameSite: 'lax'
};

// Controladores para registro
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;  
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "El usuario ya existe" });
  
    const hashedPassword = await bcrypt.hash(password, 10);  
    const newUser = await User.create({ 
      username, 
      password: hashedPassword,
      email: `${username}@gmail.com`
    });

    res.status(201).json({
      message: "Usuario creado con éxito",
      user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear el usuario" });
  }
};

// Controladores para login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Usuario y contraseña requeridos" });

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('currentUser', token, {
      ...CURRENT_USER_COOKIE_OPTS,
      maxAge: 3600000
    });

    return res.status(200).json({ message: "Login exitoso", token: token });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Controlador para obtener el usuario actual desde el token
export const getCurrentUser = (req, res) => {
  res.status(200).json({ message: "Usuario actual obtenido desde el token", user: req.user });
};

// Controlador para logout
export const logout = (req, res) => {
  res.clearCookie('currentUser', CURRENT_USER_COOKIE_OPTS);
  res.status(200).json({ message: "Logout exitoso. Cookie eliminada." });
};