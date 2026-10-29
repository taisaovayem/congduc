import { Logger } from '@nestjs/common';
import { createAppDataSource } from './create-data-source';

const logger = new Logger('Migrations');

export async function runMigrationsOnStartup(): Promise<void> {
  const dataSource = createAppDataSource();
  await dataSource.initialize();
  try {
    const executed = await dataSource.runMigrations();
    if (executed.length === 0) {
      logger.log('Không có migration mới');
    } else {
      logger.log(`Đã chạy ${executed.length} migration: ${executed.map((m) => m.name).join(', ')}`);
    }
  } finally {
    await dataSource.destroy();
  }
}
