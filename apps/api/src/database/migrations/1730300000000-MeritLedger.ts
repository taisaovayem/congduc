import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  createMeritLedgerTables,
  dropMeritLedgerTables,
  migrateLegacyMeritPointsToLedger,
  restoreLegacyMeritPointsColumn,
} from './helpers/merit-ledger.schema';

export class MeritLedger1730300000000 implements MigrationInterface {
  name = 'MeritLedger1730300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLegacyMeritColumn = await queryRunner.hasColumn('accounts', 'merit_points');
    if (!hasLegacyMeritColumn) {
      return;
    }

    await createMeritLedgerTables(queryRunner);
    await migrateLegacyMeritPointsToLedger(queryRunner);
    await queryRunner.dropColumn('accounts', 'merit_points');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasLedgerTable = await queryRunner.hasTable('merit_ledger_entries');
    if (!hasLedgerTable) {
      return;
    }

    await restoreLegacyMeritPointsColumn(queryRunner);
    await dropMeritLedgerTables(queryRunner);
  }
}
