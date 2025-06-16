import express from 'express';
import { cartController } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

export const cartRoutes = express.Router();

// Rutas que requieren autenticación
cartRoutes.use(authMiddleware);

// Obtener el carrito actual del usuario
cartRoutes.get('/', cartController.getCart);

// Añadir un producto al carrito
cartRoutes.post('/', cartController.addProduct);

// Actualizar cantidad de un producto en el carrito
cartRoutes.put('/', cartController.updateProductQuantity);

// Eliminar un producto específico del carrito
cartRoutes.delete('/:productId', cartController.removeProduct);

// Deshacer ultima modificación
cartRoutes.put('/undo', cartController.undoLastChange);

// Procesar la compra (checkout)
cartRoutes.post('/checkout', cartController.checkout);
