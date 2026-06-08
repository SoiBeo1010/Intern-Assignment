import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = parseInt(process.env.DB_PORT || '3307', 10);
const DB_USER = process.env.DB_USER || 'gscores';
const DB_PASSWORD = process.env.DB_PASSWORD || 'secret';
const DB_NAME = process.env.DB_NAME || 'gscores_db';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, '/entities/*.{ts,js}')],
  migrations: [path.join(__dirname, '/db/migrations/*.{ts,js}')],
});

export default AppDataSource;
