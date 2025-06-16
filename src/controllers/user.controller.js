import { userService } from '../services/index.js';

class UserController {
  // Método para registrar un nuevo usuario
  async register(req, res) {
    try {
      const { email, password, name, address, phone, document } = req.body;

      // Validar que todos los campos estén presentes
      if (!email || !password || !address || !phone || !document) {
        return res.status(400).json({
          message: 'Todos los campos son obligatorios'
        });
      }

      // Llamar al servicio para registrar el usuario
      const user = await userService.registerUser(
        email,
        password,
        name,
        document,
        address,
        phone
      );

      // Respuesta de éxito
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        userId: user._id
      });
    } catch (error) {
      // Manejo de errores específicos
      if (error.message === 'User already exists') {
        return res.status(409).json({
          message: 'El usuario ya existe'
        });
      }

      // Error genérico del servidor
      res.status(500).json({
        message: 'Error en el registro',
        error: error.message
      });
    }
  }

  // Método para iniciar sesión
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar que todos los campos estén presentes
      if (!email || !password) {
        return res.status(400).json({
          message: 'Email y password son obligatorios'
        });
      }

      // Llamar al servicio para iniciar sesión
      const { user, token } = await userService.loginUser(email, password);

      // Respuesta de éxito
      res.status(200).json({
        message: 'Inicio de sesión exitoso',
        token,
        userId: user._id,
      });
    } catch (error) {
      // Manejo de errores específicos
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          message: 'Credenciales inválidas'
        });
      }

      // Error genérico del servidor
      res.status(500).json({
        message: 'Error en el inicio de sesión',
        error: error.message
      });
    }
  }

  // Método para cerrar sesión
  async logout(req, res) {
    try {
      // Obtener el token de autorización
      const token = req.headers['authorization']?.split(' ')[1];

      // Llamar al servicio para cerrar sesión
      await userService.logoutUser(token, req.user.id);

      // Respuesta de éxito
      res.status(200).json({
        message: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      // Error genérico del servidor
      res.status(500).json({
        message: 'Error al cerrar sesión',
        error: error.message
      });
    }
  }

  // Método para obtener perfil de usuario
  async getProfile(req, res) {
    try {
      // Obtener el perfil del usuario usando el ID del token
      const user = await userService.getUserProfile(req.user.id);

      // Respuesta de éxito
      res.status(200).json({
        message: 'Perfil de usuario obtenido',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          address: user.address,
          phone: user.phone,
          document: user.document,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      // Error genérico del servidor
      res.status(500).json({
        message: 'Error al obtener el perfil',
        error: error.message
      });
    }
  }
}

// Exportar una instancia del controlador
export const userController = new UserController();