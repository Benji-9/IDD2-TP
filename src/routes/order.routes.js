import express from 'express';
import { orderController } from '../controllers/index.js';
import { authMiddleware } from'../middlewares/index.js';

export const orderRoutes = express.Router();

// Todas las rutas requieren autenticación
orderRoutes.use(authMiddleware);

// Obtener órdenes
orderRoutes.get('/', orderController.getOrders);

// Marcar una orden como pagada
orderRoutes.put('/:orderId/pay', orderController.markOrderAsPaid);

// Cancelar una orden
orderRoutes.put('/:orderId/cancel', orderController.cancelOrder);