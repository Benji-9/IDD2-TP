import { orderService } from '../services/index.js';

class OrderController {

  async getOrders(req, res) {
    try {
      const {
        userId,
        document,
        invoice_status,
        start_date,
        end_date,
      } = req.query;

      const filters = {};

      // Filtro por usuario
      if (userId) {
        filters.customer_id = userId;
      }

      // Filtro por documento
      if (document) {
        filters.customer_document = document;
      }

      // Filtro por estado de factura
      if (invoice_status) {
        filters['invoice.status'] = invoice_status;
      }

      // Filtro por rango de fechas
      if (start_date || end_date) {
        filters.created_at = {};

        if (start_date) {
          filters.created_at.$gte = new Date(start_date);
        }

        if (end_date) {
          filters.created_at.$lte = new Date(end_date);
        }
      }

      // Obtener órdenes usando el servicio
      const orders = await orderService.getOrders(filters);

      res.status(200).json(orders);
    } catch (error) {
      // Manejar errores de fecha inválida
      if (error instanceof RangeError) {
        return res.status(400).json({
          message: 'Rango de fechas inválido'
        });
      }

      res.status(500).json({
        message: 'Error al obtener las órdenes',
        error: error.message
      });
    }
  }

  async markOrderAsPaid(req, res) {
    try {
      const { orderId } = req.params;
      const { paymentMethod } = req.body;

      // Validaciones
      if (!paymentMethod) {
        return res.status(400).json({
          message: 'Método de pago es requerido'
        });
      }

      // Marcar orden como pagada
      const order = await orderService.markOrderAsPaid(orderId, paymentMethod);

      res.status(200).json(order);
    } catch (error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({
          message: 'Orden no encontrada'
        });
      }

      res.status(500).json({
        message: 'Error al marcar la orden como pagada',
        error: error.message
      });
    }
  }

  // Cancelar una orden
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;

      // Cancelar orden
      const order = await orderService.cancelOrder(orderId);

      res.status(200).json(order);
    } catch (error) {
      if (error.message === 'Order not found') {
        return res.status(404).json({
          message: 'Orden no encontrada'
        });
      }

      res.status(500).json({
        message: 'Error al cancelar la orden',
        error: error.message
      });
    }
  }
}

export const orderController = new OrderController();