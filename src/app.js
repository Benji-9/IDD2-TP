import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from 'dotenv'
config();

import { connectMongoDB, connectRedis, connectNeo4j } from './config/index.js'

// Services
import { authService, productsService, cartService } from './services/index.js';

// Importar rutas
import { userRoutes, productsRoutes, cartRoutes, orderRoutes } from './routes/index.js';

// Se crea app express
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Conectar bases de datos
const initializeDB = async () => {
  await connectMongoDB();
  // Redis y Neo4j devuelven un cliente que necesitamos guardar
  const redisClient = await connectRedis();
  const neo4jDriver = connectNeo4j();

  // Inicializar services con clients
  authService.setConnection(redisClient)
  productsService.setConnection(redisClient, neo4jDriver)
  cartService.setConnection(redisClient)
}

initializeDB();

// Configurar rutas
app.use('/api/user', userRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});