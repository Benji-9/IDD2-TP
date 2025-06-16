import express from 'express';
import { productsController } from '../controllers/index.js';
import { authMiddleware } from '../middlewares/index.js';

export const productsRoutes = express.Router();

// GET todos los productos (con filtros opcionales en query params)
productsRoutes.get('/', productsController.getProducts);

// GET búsqueda de productos
productsRoutes.get('/search', productsController.searchProducts);

// GET producto por ID
productsRoutes.get('/:id', productsController.getProductById);

// PUT cambiar prop de un producto
productsRoutes.put('/:id', authMiddleware, productsController.updateProduct);

// GET productos relacionados
productsRoutes.get('/:id/related', productsController.getRelatedProducts);

// GET cambios realizados de un producto
productsRoutes.get('/:id/changes', authMiddleware, productsController.getProductChanges);