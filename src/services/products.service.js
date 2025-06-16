import { Product } from '../models/index.js';

class ProductsService {
  setConnection(redisClient, neo4jDriver) {
    this.redisClient = redisClient;
    this.neo4jDriver = neo4jDriver;
    this.TTL = 10;
  }

  // Obtener todos los productos
  async getProducts({ category, sort }) {
    try {
      const cacheKey = category ? `products:${category}` : 'products';

      // Intentar obtener de cache
      let products = await this.redisClient.get(cacheKey);
      if (products) {
        // Como estaban guardados como un string, se transforma la lista a JSON
        products = JSON.parse(products);
        if (sort) {
          products.sort((a, b) => sort === 'asc' ? a.price - b.price : b.price - a.price);
        }
        console.log("PRODUCTOS DESDE CACHE")
        return products;
      }

      // Si no está en cache, buscar en MongoDB
      let query = category ? { category } : {};
      let productsQuery = Product.find(query, { name: 1, price: 1 });  // Solo nombre y precio
      if (sort) {
        productsQuery = productsQuery.sort({ price: sort === 'asc' ? 1 : -1 });
      }
      products = await productsQuery;

      // Guardar en cache
      await this.redisClient.setEx(cacheKey, this.TTL, JSON.stringify(products));

      console.log("PRODUCTOS DESDE MONGO")
      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  // Obtener producto por ID
  async getProductById(id) {
    try {
      const product = await Product.findById(id);

      if (product) {
        // Se guarda el nombre, precio y stock del producto en caché por si
        // posteriormente se desea agregar al carrito
        await this.redisClient.SETEX(
          `product:${id}`,
          this.TTL,
          JSON.stringify({
            name: product.name,
            price: product.price,
            stock: product.stock
          })
        );
      }

      return product;
    } catch (error) {
      console.error('Error getting product by id:', error);
      throw error;
    }
  }

  // Buscar productos
  async searchProducts(query) {
    // Se busca en MongoDB los productos cuyo nombre o descrpción contengan el string
    // de búsqueda
    return await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });
  }

  // Obtener productos relacionados
  async getRelatedProducts(id) {
    const session = this.neo4jDriver.session();

    try {
      const product = await Product.findById(id);
      if (!product) return [];

      // Query de Neo4j para encontrar productos relacionados por tags
      const result = await session.run(`
            MATCH (p1:Product {mongoId: $productId})
            MATCH (p1)-[:HAS_TAG]->(tag)<-[:HAS_TAG]-(p2:Product)
            WHERE p1 <> p2
            WITH p2, count(*) as commonTags
            ORDER BY commonTags DESC
            RETURN DISTINCT p2.mongoId as relatedId
            LIMIT 10
        `, {
        productId: id
      });

      // Nos quedamos con los ids de los productos relacionados
      const relatedIds = result.records.map(record => record.get('relatedId'));

      if (relatedIds.length > 0) {
        // Se devuelven los productos relacionados
        return await Product.find({ _id: { $in: relatedIds } });
      }

      // Si no hay productos relacionados por tags, buscar por categoría
      return await Product.find({
        category: product.category,
        _id: { $ne: id }
      }).limit(4);

    } catch (error) {
      console.error('Neo4j error:', error);
      return [];
    } finally {
      await session.close();
    }
  }
}

export const productsService = new ProductsService();