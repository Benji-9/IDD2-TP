import { Order } from '../models/index.js';
import { userService, productsService } from '../services/index.js';

const TAX_PERCENTAGE = 0.21;
const DISCOUNT_PERCENTAGE = 0;

class OrderService {

  async createOrder(userId, cart) {
    try {
      // Se obtienen los datos del usuario logueado
      const user = await userService.getUserProfile(userId);

      console.log('CART', cart)

      // Preparar los items de la orden con precios actualizados
      const orderItems = await Promise.all(cart.map(async (item) => {
        // Buscar el producto en MongoDB para obtener el precio actualizado
        const product = await productsService.getProductById(item.id);

        // De cada producto guardar nombre, cantidad a comprar y precio unitario
        return {
          name: product.name,
          quantity: item.quantity,
          unit_price: product.price
        };
      }));

      console.log(orderItems);

      // Calcular subtotal
      const subtotal = orderItems.reduce((total, item) =>
        total + (item.quantity * item.unit_price), 0);

      // Calcular totales
      const discountAmount = subtotal * DISCOUNT_PERCENTAGE;
      const taxAmount = subtotal * TAX_PERCENTAGE;
      const total = subtotal + taxAmount - discountAmount;

      // Se crea la Órden con el model de mongoose
      const order = new Order({
        customer_id: userId,
        customer_document: user.document,
        customer_info: {
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address
        },
        items: orderItems,
        summary: {
          subtotal,
          discount_percentage: DISCOUNT_PERCENTAGE,
          tax_percentage: TAX_PERCENTAGE,
          total
        },
        order_status: 'created',
        invoice: {
          status: 'unpaid'
        }
      });

      // Guardar la orden en MongoDB
      await order.save();

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrders(filters = {}) {
    try {
      // Se obtienen las órdenes que cumplan con los filters
      const orders = await Order.find(filters);

      return orders
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Método para marcar una orden como pagada
  async markOrderAsPaid(orderId, paymentMethod) {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      // Marcar como pagada
      await order.markAsPaid(paymentMethod);

      return order;
    } catch (error) {
      console.error('Error marking order as paid:', error);
      throw error;
    }
  }

  // Método para cancelar una orden
  async cancelOrder(orderId) {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new Error('Order not found');
      }

      // Cancelar orden
      await order.cancel();

      return order;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();