import { productsService, productsChangesService } from '../services/index.js';

class ProductsController {
    // GET todos los productos
    async getProducts(req, res) {
        try {
            const { category, sort } = req.query;

            const products = await productsService.getProducts({ category, sort });
            res.json(products);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // GET producto por ID
    async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await productsService.getProductById(id);

            if (!product) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }

            res.json(product);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // GET búsqueda de productos
    async searchProducts(req, res) {
        try {
            const { query } = req.query;
            const products = await productsService.searchProducts(query);

            res.json(products);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // GET productos relacionados
    async getRelatedProducts(req, res) {
        try {
            const { id } = req.params;
            const relatedProducts = await productsService.getRelatedProducts(id);
            res.json(relatedProducts);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Actualizar una propiedad de un producto
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const { field, value } = req.body;

            // Validaciones básicas
            if (!field || value === undefined) {
                return res.status(400).json({
                    message: 'Campo y valor son requeridos'
                });
            }

            // Lista de campos permitidos para modificar
            const allowedFields = [
                'name',
                'description',
                'price',
                'stock',
            ];

            if (!allowedFields.includes(field)) {
                return res.status(400).json({
                    message: 'No se puede modificar este campo'
                });
            }

            // Obtener el ID del usuario desde el token de autenticación
            const userId = req.user.id;

            // Actualizar producto y registrar cambio
            const updatedProduct = await productsChangesService.updateProduct(
                id,
                field,
                value,
                userId
            );

            res.status(200).json({
                message: 'Producto actualizado exitosamente',
                product: updatedProduct
            });
        } catch (error) {
            // Manejar errores específicos
            if (error.message === 'Product not found') {
                return res.status(404).json({
                    message: 'Producto no encontrado'
                });
            }

            res.status(500).json({
                message: 'Error al actualizar el producto',
                error: error.message
            });
        }
    }

    // Obtener historial completo de cambios de un producto
    async getProductChanges(req, res) {
        try {
            const { id } = req.params;

            // Obtener historial completo
            const changeHistory = await productsChangesService.getProductChanges(
                id
            );

            res.status(200).json({
                message: 'Historial completo de cambios obtenido',
                changeHistory
            });
        } catch (error) {
            res.status(500).json({
                message: 'Error al obtener historial completo de cambios',
                error: error.message
            });
        }
    }
};

export const productsController = new ProductsController();
