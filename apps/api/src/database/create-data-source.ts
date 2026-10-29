import path from 'node:path';
import { DataSource } from 'typeorm';
import { getDatabaseEnv } from './database.env';

export function createAppDataSource(): DataSource {
  const env = getDatabaseEnv();
  return new DataSource({
    type: 'postgres',
    host: env.host,
    port: env.port,
    username: env.username,
    password: env.password,
    database: env.database,
    entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
    migrations: [path.join(__dirname, 'migrations/*.{ts,js}')],
    synchronize: false,
  });
}
