import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: {
    type: String,
    required: true,
    select: false // Evita que la contraseña se devuelva en consultas
  },

  // Información personal
  name: {
    type: String,
    trim: true,
    required: true
  },
  document: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  // Campos de contacto
  phone: {
    type: String,
    trim: true,
  },

  // Dirección
  address: {
    type: String,
    required: true,
    trim: true
  },

  // Metadatos
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
}, {
  timestamps: true, // Añade createdAt y updatedAt
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Eliminar campos sensibles al convertir a JSON
      delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
})

// Métodos de instancia
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Crear modelo
export const User = model('User', UserSchema);