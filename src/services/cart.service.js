import { userActivityService } from './index.js'
import { Product } from '../models/Product.js'

class CartService {
    setConnection(redisClient) {
        this.redisClient = redisClient;
        this.TTL = 60 * 60 * 24;
    }

    // Las acciones serían:
    // { type: 'ADD', productId: '123', quantity: 1 }
    // { type: 'REMOVE', productId: '123', previousQuantity: 2 }
    // { type: 'UPDATE', productId: '123', previousQuantity: 2, newQuantity: 3 }

    async getCart(userId) {
        try {
            // Se obtiene el carrito del userId
            const cart = await this.redisClient.GET(`cart:${userId}:current`);

            // Se transforma en json y se devuelve
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            throw new Error('Error getting cart');
        }
    }

    async addProduct(userId, productId, quantity = 1, undo = false) {
        try {
            // Se obtiene el carrito actual
            let cart = await this.redisClient.GET(`cart:${userId}:current`);
            cart = cart ? JSON.parse(cart) : [];

            // Buscar el producto en el carrito
            const itemIndex = cart.findIndex(item => item.id === productId);
            if (itemIndex !== -1) {
                // Si el producto a agregar ya se encuentra en el carrito, se le suma
                // la cantidad nueva
                return this.updateProductQuantity(userId, productId, cart[itemIndex].quantity + quantity)
            }

            // Si el producto NO está en el carrito, obtengo producto de redis
            let product = await this.redisClient.GET(`product:${productId}`);

            if (!product) {
                console.log('BUSCO PRODUCTO EN MONGO')

                // Si no está en Redis, buscarlo en MongoDB
                product = await Product.findById(productId, { name: 1, stock: 1, price: 1 });
                if (!product) {
                    throw new Error('Product not found');
                }

                // Guardar en Redis
                await this.redisClient.SETEX(`product:${productId}`, this.TTL, JSON.stringify({
                    name: product.name,
                    price: product.price,
                    stock: product.stock
                }));
            } else {
                console.log('BUSCO PRODUCTO EN CACHE');
                product = JSON.parse(product);
            }

            const cartItem = {
                id: productId,
                name: product.name,
                price: product.price,
                quantity
            };

            // Actualizo carrito (se pushea el nuevo producto)
            cart.push(cartItem);
            await this.redisClient.SETEX(
                `cart:${userId}:current`,
                this.TTL,
                JSON.stringify(cart)
            );

            // Se guarda el carrito actual en redis
            await this.redisClient.expire(`cart:${userId}:current`, this.TTL);

            userActivityService.logUserActivity(
                userId,
                'product_added_to_cart',
                `product ${productId} added to cart`
            );

            if (!undo) {
                await this.saveAction(userId, {
                    type: 'ADD',
                    productId,
                    quantity
                });
            }

            return cart;
        } catch (error) {
            console.error(error)
            throw new Error('Error adding product to cart');
        }
    }

    async updateProductQuantity(userId, productId, newQuantity, undo = false) {
        try {
            // Obtener carrito actual
            let cart = await this.redisClient.GET(`cart:${userId}:current`);
            cart = cart ? JSON.parse(cart) : [];

            // Buscar el producto en el carrito
            const itemIndex = cart.findIndex(item => item.id === productId);
            if (itemIndex === -1) {
                throw new Error('Product not in cart');
            }

            // Almacenamos la cantidad anterior por si luego hay que reestablecer
            const previousQuantity = cart[itemIndex].quantity;

            if (newQuantity <= 0) {
                // Si la cantidad es menor a 0, se borra del carrito
                cart.splice(itemIndex, 1);
            } else {
                cart[itemIndex].quantity = newQuantity;
            }

            // Actualizar carrito en redis
            await this.redisClient.SETEX(
                `cart:${userId}:current`,
                this.TTL,
                JSON.stringify(cart)
            );

            if (!undo) {
                await this.saveAction(userId, {
                    type: 'UPDATE',
                    productId,
                    previousQuantity: previousQuantity,
                    newQuantity
                });
            }

            userActivityService.logUserActivity(
                userId,
                'product_modified_on_cart',
                `product ${productId} quantity from ${previousQuantity} to ${newQuantity} on cart`
            );

            return cart;
        } catch (error) {
            console.error(error)
            throw new Error('Error updating product quantity');
        }
    }

    async removeProduct(userId, productId, undo = false) {
        try {
            // Obtener carrito actual
            let cart = await this.redisClient.GET(`cart:${userId}:current`);
            cart = cart ? JSON.parse(cart) : [];

            // Buscar el producto en el carrito
            const itemIndex = cart.findIndex(item => item.id === productId);
            if (itemIndex === -1) {
                throw new Error('Product not in cart');
            }

            if (!undo) {
                await this.saveAction(userId, {
                    type: 'REMOVE',
                    productId,
                    previousQuantity: cart[itemIndex].quantity,
                });
            }

            // Se borra el producto del array
            cart.splice(itemIndex, 1);

            // Actualizar carrito en redis
            await this.redisClient.SETEX(
                `cart:${userId}:current`,
                this.TTL,
                JSON.stringify(cart)
            );

            userActivityService.logUserActivity(
                userId,
                'product_deleted_on_cart',
                `product ${productId} deleted from cart`
            );

            return cart;
        } catch (error) {
            throw new Error('Error removing product from cart');
        }
    }

    async undoLastChange(userId) {
        try {
            const lastAction = await this.redisClient.LPOP(`cart:${userId}:history`);
            if (!lastAction) {
                throw new Error('No actions to undo');
            }

            const action = JSON.parse(lastAction);

            // Restaurar estado previo según el tipo de acción
            switch (action.type) {
                case 'ADD':
                    await this.removeProduct(userId, action.productId, true);
                    break;
                case 'REMOVE':
                    await this.addProduct(userId, action.productId, action.previousQuantity, true);
                    break;
                case 'UPDATE':
                    await this.updateProductQuantity(userId, action.productId, action.previousQuantity, true);
                    break;
            }

            return await this.getCart(userId);
        } catch (error) {
            throw new Error('Error undoing last change');
        }
    }

    async saveAction(userId, action) {
        try {
            await this.redisClient.LPUSH(
                `cart:${userId}:history`,
                JSON.stringify(action)
            );

            // Se guardarán como máximo 10 acciones
            await this.redisClient.LTRIM(`cart:${userId}:history`, 0, 9);

            await this.redisClient.expire(`cart:${userId}:history`, this.TTL);
        } catch (error) {
            throw new Error('Error saving action');
        }
    }

    async clear(userId) {
        try {
            await this.redisClient.del(`cart:${userId}:history`);
            await this.redisClient.del(`cart:${userId}:current`);
        } catch (error) {
            throw new Error('Error during checkout.');
        }
    }
}

export const cartService = new CartService();