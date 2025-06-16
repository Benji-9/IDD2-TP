import { driver as _driver, auth } from 'neo4j-driver';

export const connectNeo4j = () => {
  try {
    const driver = _driver(
      process.env.NEO4J_URI,
      auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );

    console.log('Neo4j connected');
    return driver;
  } catch (error) {
    console.error('Neo4j connection error:', error);
    process.exit(1);
  }
};