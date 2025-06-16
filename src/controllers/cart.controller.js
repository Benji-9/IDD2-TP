import { cartService, orderService } from '../services/index.js';

class CartController {

  async getCart(req, res) {
    try {
      const userId = req.user.id;
      const cart = await cartService.getCart(userId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async addProduct(req, res) {
    try {
      const userId = req.user.id;
      const { productId, quantity } = req.body;

      const cart = await cartService.addProduct(userId, productId, quantity);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateProductQuantity(req, res) {
    try {
      const userId = req.user.id;
      const { productId, quantity } = req.body;

      const cart = await cartService.updateProductQuantity(userId, productId, quantity);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async removeProduct(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const cart = await cartService.removeProduct(userId, productId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async undoLastChange(req, res) {
    try {
      const userId = req.user.id;

      const cart = await cartService.undoLastChange(userId);
      res.json(cart);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async checkout(req, res) {
    try {
      const userId = req.user.id;

      const cart = await cartService.getCart(userId);

      const order = await orderService.createOrder(userId, cart);

      await cartService.clear(userId);

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export const cartController = new CartController();