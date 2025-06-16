import { Schema, model } from 'mongoose';

const UserActivitySchema = new Schema({
  // Referencia al usuario que realizó la actividad
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Listado de actividades
  activities: [{
    // Tipo de acción realizada
    action: {
      type: String,
      required: true,
      enum: [
        'user_registered',
        'user_login',
        'user_login_failed',
        'user_logout',
        'product_added_to_cart',
        'product_modified_on_cart',
        'product_deleted_on_cart',
        'order_created',
      ]
    },

    // Timestamp de la actividad
    timestamp: {
      type: Date,
      default: Date.now
    },

    // Información adicional sobre la actividad
    details: {
      type: String,
      trim: true
    },
  }],
}, {
  // Opciones del esquema
  timestamps: true
});

// Middleware para actualizar lastActivityAt (se ejecuta antes de un save)
UserActivitySchema.pre('save', function(next) {
  if (this.activities.length > 0) {
    this.lastActivityAt = this.activities[this.activities.length - 1].timestamp;
  }
  next();
});

// Índices para mejorar rendimiento
UserActivitySchema.index({ user: 1 });
UserActivitySchema.index({ 'activities.timestamp': -1 });

// Método para añadir una nueva actividad
UserActivitySchema.methods.addActivity = function(action, details = '', metadata = {}) {
  this.activities.push({
    action,
    details,
    metadata
  });
  return this.save();
};

// Método para obtener actividades recientes
UserActivitySchema.methods.getRecentActivities = function(limit = 10) {
  return this.activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

export const UserActivity = model('UserActivity', UserActivitySchema);