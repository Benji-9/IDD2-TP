import { createClient } from 'redis';

export const connectRedis = async () => {
  try {
    const client = createClient({
      username: process.env.REDIS_USER,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_PORT
      }
    });


    client.on('error', (err) => console.error('Redis error:', err));
    client.on('connect', () => console.log('Redis connected'));

    await client.connect();

    return client;
  } catch (error) {
    console.error('Redis connection error:', error);
    process.exit(1);
  }
};