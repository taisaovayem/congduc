import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getDatabaseEnv } from './database.env';

export function typeOrmConfig(): TypeOrmModuleOptions {
  const env = getDatabaseEnv();
  return {
    type: 'postgres',
    host: env.host,
    port: env.port,
    username: env.username,
    password: env.password,
    database: env.database,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  };
}
