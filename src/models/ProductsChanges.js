import { Schema, model } from 'mongoose';

const ProductsChangesSchema = new Schema({
  // Referencia al producto modificado
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  changes: [{
    // Referencia al usuario que realizó el cambio
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Campo modificado
    field: {
      type: String,
      required: true,
      trim: true
    },

    oldValue: {
      type: Schema.Types.Mixed,
      default: null
    },

    newValue: {
      type: Schema.Types.Mixed,
      required: true
    },

    changedAt: {
      type: Date,
      default: Date.now
    }
  }],

  lastChangedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para mejorar rendimiento
ProductsChangesSchema.index({ product: 1 });
ProductsChangesSchema.index({ changedBy: 1 });
ProductsChangesSchema.index({ 'changes.changedAt': -1 });

// Método para obtener cambios recientes
ProductsChangesSchema.methods.getRecentChanges = function(limit = 10) {
  return this.changes
    .sort((a, b) => b.changedAt - a.changedAt)
    .slice(0, limit);
};

export const ProductsChanges = model('ProductsChanges', ProductsChangesSchema);