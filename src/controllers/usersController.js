import { User } from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;  
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "El usuario ya existe" });
  
    const hashedPassword = await bcrypt.hash(password, 10);  
    const newUser = await User.create({ 
      username, 
      password: hashedPassword 
    });

    res.status(201).json({
      message: "Usuario creado con éxito",
      user: { id: newUser._id, username: newUser.username }
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear el usuario" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Usuario y contraseña requeridos" });

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // guardamos el token en una cookie segura y firmada
    res.cookie('currentUser', token, {
      httpOnly: true,
      signed: true, 
      maxAge: 3600000, 
      sameSite: 'strict'
    });

    return res.status(200).json({ 
      message: "Login exitoso",
      token: token 
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// Endpoint /current
export const getCurrentUser = (req, res) => {
  res.status(200).json({ 
    message: "Usuario actual obtenido desde el token",
    user: req.user 
  });
};

export const logout = (req, res) => {
  // Limpiamos la cookie al cerrar sesión
  res.clearCookie('currentUser');
  res.status(200).json({ 
    message: "Logout exitoso. Cookie eliminada." 
  });
};