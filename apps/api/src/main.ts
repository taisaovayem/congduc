import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { AppModule } from './app.module';
import { runMigrationsOnStartup } from './database/run-migrations';

loadEnv({ path: path.resolve(__dirname, '../../../.env') });

async function bootstrap() {
  await runMigrationsOnStartup();
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api/v1');
  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
