import { User } from '../models/index.js';
import { userActivityService, authService } from './index.js';;

class UserService {

  async registerUser(email, password, name, document, address, phone) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Crear nuevo usuario con el model User
      const newUser = new User({
        email,
        password: password,
        name,
        document,
        address,
        phone
      });

      // Guardar usuario
      const savedUser = await newUser.save();

      // Crear registro de actividad
      userActivityService.logUserActivity(savedUser._id, 'user_registered', 'New user registration');

      return savedUser;
    } catch (error) {
      throw error;
    }
  }

  async loginUser(email, password) {
    try {
      // Buscar usuario y seleccionar explícitamente la contraseña
      // (el model está configurado para que por defecto no devuelve la password)
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verificar contraseña
      if (password != user.password) {
        // Registrar intento de login fallido
        userActivityService.logUserActivity(user._id, 'user_login_failed', 'Incorrect password attempt');

        throw new Error('Invalid credentials');
      }

      // Crear sesión
      const token = await authService.createSession(user._id);

      // Registrar actividad de login
      userActivityService.logUserActivity(user._id, 'user_login', 'Successful login');

      return { user, token };
    } catch (error) {
      throw error;
    }
  }

  async logoutUser(token, userId) {
    try {
      // Destruir sesión
      await authService.destroySession(token);

      // Registrar actividad de logout
      userActivityService.logUserActivity(userId, 'user_logout', 'User logged out');
    } catch (error) {
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      // Buscar usuario por ID
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Método para validar sesión (usado por middleware de autenticación)
  async validateSession(token) {
    try {
      // Validar token a través del servicio de autenticación
      return await authService.validateSession(token);
    } catch (error) {
      throw error;
    }
  }
}

export const userService = new UserService();