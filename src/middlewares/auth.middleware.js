import { userService } from '../services/index.js';

// Middleware de autenticación
export const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el token del header de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Verificar si existe el token
    if (!token) {
      return res.status(401).json({
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Validar el token y obtener el ID de usuario
    const userId = await userService.validateSession(token);

    // Si no hay userId, el token es inválido
    if (!userId) {
      return res.status(401).json({
        message: 'Token de autenticación inválido'
      });
    }

    // Adjuntar la información del usuario al request
    req.user = { id: userId };

    // Continuar con la siguiente middleware o controlador
    next();
  } catch (error) {
    // Manejo de errores de autenticación
    console.error('Error de autenticación:', error);

    // Diferentes tipos de errores de autenticación
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token de autenticación expirado'
      });
    }

    // Error genérico de autenticación
    res.status(401).json({
      message: 'No autorizado',
      error: error.message
    });
  }
};

// Middleware opcional para rutas públicas
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Si no hay token, continuar sin autenticar
    if (!token) {
      return next();
    }

    // Validar el token si existe
    const userId = await userService.validateSession(token);

    // Adjuntar la información del usuario si el token es válido
    if (userId) {
      req.user = { id: userId };
    }

    next();
  } catch (error) {
    // Ignorar errores de autenticación en rutas públicas
    next();
  }
};