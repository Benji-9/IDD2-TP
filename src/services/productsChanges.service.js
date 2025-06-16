import { ProductsChanges, Product } from '../models/index.js';

class ProductsChangesService {

  // Registrar un cambio en un producto
  async logProductChange(productId, field, oldValue, newValue, changedBy) {
    try {
      await ProductsChanges.findOneAndUpdate(
        { product: productId },
        {
          $push: {
            changes: {
              changedBy,
              field,
              oldValue,
              newValue,
              changedAt: new Date()
            }
          }
        },
        {
          upsert: true,  // Crear el documento si no existe
          new: true      // Devolver el documento actualizado
        }
      );
    } catch (error) {
      console.error('Error logging product change:', error);
      throw error;
    }
  }

  async updateProduct(productId, field, newValue, userId) {
    try {
      // Obtenemos el producto a modificar
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error('Product not found');
      }

      // Guardar el valor anterior
      const oldValue = product[field];

      // Actualizar el campo desesado del producto
      product[field] = newValue;
      // guardar producto modificado
      await product.save();

      // Registrar el cambio
      await this.logProductChange(
        productId,
        field,
        oldValue,
        newValue,
        userId
      );

      return product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Obtener todos los cambios de un producto con detalles
  async getProductChanges(productId) {
    try {
      // Se obtiene el documento que contiene los cambios del producto con id productID
      const productChanges = await ProductsChanges.findOne({ product: productId })
        .populate('product'); // Obtenemos también los datos del producto

      return productChanges || { product: productId, changes: [] };
    } catch (error) {
      console.error('Error fetching product change history:', error);
      throw error;
    }
  }
}

export const productsChangesService = new ProductsChangesService();