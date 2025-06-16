import { Schema, model } from 'mongoose';

const ORDER_STATUSES = ['created', 'completed', 'cancelled'];
const PAYMENT_METHODS = ['CREDIT', 'DEBIT', 'CASH', 'TRANSFER'];
const INVOICE_STATUSES = ['unpaid', 'paid', 'cancelled'];

const OrderSchema = new Schema({
  customer_id: {
    type: Schema.Types.ObjectId,
    ref: 'User', // campo que hace referencia a doc de collection User
    required: true
  },
  customer_document: {
    type: String,
    required: true,
    trim: true
  },
  customer_info: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    }
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  items: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  summary: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    tax_percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },

  order_status: {
    type: String,
    enum: ORDER_STATUSES,
    default: 'created'
  },

  invoice: {
    created_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: 'unpaid'
    },
    payment: {
      method: {
        type: String,
        enum: PAYMENT_METHODS
      },
      paid_at: {
        type: Date
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar rendimiento
OrderSchema.index({ customer_id: 1 });
OrderSchema.index({ customer_document: 1 });
OrderSchema.index({ created_at: -1 });
OrderSchema.index({ 'invoice.status': 1 });

// Método del schema para marcar como pagada
OrderSchema.methods.markAsPaid = function (paymentMethod) {
  this.invoice.status = 'paid';
  this.invoice.payment.method = paymentMethod;
  this.invoice.payment.paid_at = new Date();
  this.order_status = 'completed';
  return this.save();
};

// Método del schema para cancelar orden
OrderSchema.methods.cancel = function () {
  this.order_status = 'cancelled';
  this.invoice.status = 'cancelled';
  return this.save();
};

export const Order = model('Order', OrderSchema);