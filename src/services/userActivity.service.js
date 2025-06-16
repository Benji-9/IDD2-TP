import { UserActivity } from '../models/UserActivity.js';

class ActivityService {
  // Método para registrar una actividad de usuario
  async logUserActivity(userId, action, details = '') {
    try {
      await UserActivity.findOneAndUpdate(
        { user: userId },
        {
          $push: {
            activities: {
              action,
              details,
              timestamp: new Date()
            }
          }
        },
        {
          upsert: true,  // Crear el documento si no existe
          new: true      // Devolver el documento actualizado
        }
      );
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  // Método para obtener actividades recientes de un usuario
  async getUserActivities(userId, limit = 10) {
    // Se obtiene el documento que contiene las actividades del usuaio con id userId
    try {
      const userActivities = await UserActivity.findOne({ user: userId })
        .sort({ 'activities.timestamp': -1 })
        .limit(limit);

      return userActivities ? userActivities.activities : [];
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }
}

export const userActivityService = new ActivityService();