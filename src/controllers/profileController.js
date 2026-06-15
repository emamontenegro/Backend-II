import { User } from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'No autenticado. Usuario no encontrado.' });
    }

    res.status(200).json({
      message: 'Perfil del usuario autenticado',
      user: {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};

export const getAdmin = async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.status(200).json({
      message: 'Panel de administración',
      role: req.user.role,
      users
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos de admin' });
  }
};
