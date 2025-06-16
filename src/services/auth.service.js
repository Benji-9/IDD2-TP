class AuthService {
  setConnection(redisClient) {
    // Se guarda el cliente de reddis luego de realizar la conexión para las consultas
    this.redisClient = redisClient;
  }

  async createSession(userId) {
    // Generar un token único
    const token = this.generateToken();

    // Clave de sesión en Redis
    const sessionKey = `session:${token}`;

    // Guardar la sesión en Redis con expiración de 1 hora
    await this.redisClient.set(sessionKey, userId.toString());
    await this.redisClient.expire(sessionKey, 3600); // 1 hora en segundos

    return token;
  }

  // Validar una sesión existente
  async validateSession(token) {
    // Construir la clave de sesión
    const sessionKey = `session:${token}`;

    // Obtener el ID de usuario asociado a la sesión
    const userId = await this.redisClient.get(sessionKey);

    // Si no existe el usuario, la sesión no es válida
    if (!userId) {
      return null;
    }

    // Renovar la expiración de la sesión
    await this.redisClient.expire(sessionKey, 3600);

    // Retornamos el id del usuario autenticacdo
    return userId;
  }

  async destroySession(token) {
    // Construir la clave de sesión
    const sessionKey = `session:${token}`;

    // Eliminar la sesión de Redis
    await this.redisClient.del(sessionKey);
  }

  generateToken() {
    // generación de token aleatorio
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const authService = new AuthService();