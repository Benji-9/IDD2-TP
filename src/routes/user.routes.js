import express from 'express';
import { userController } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

export const userRoutes = express.Router();

// Ruta de registro de usuario (público)
userRoutes.post('/register', userController.register);

// Ruta de inicio de sesión (público)
userRoutes.post('/login', userController.login);

// Ruta de cierre de sesión (requiere autenticación)
userRoutes.post('/logout', authMiddleware, userController.logout);

// Ruta para obtener perfil de usuario (requiere autenticación)
userRoutes.get('/profile', authMiddleware, userController.getProfile);

// TODO: recategorizar usuario cada un tiempo
userRoutes.get('/category', authMiddleware, userController.getProfile);
