import { MigrationInterface, QueryRunner } from 'typeorm';
import { MERIT_LEDGER_ENTRY_TYPE_ENUM } from './helpers/merit-ledger.schema';

const NEW_ENTRY_TYPES = ['pk_settlement_win', 'pk_settlement_loss'] as const;

export class MeritLedgerPkTypes1730700000001 implements MigrationInterface {
  name = 'MeritLedgerPkTypes1730700000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLedger = await queryRunner.hasTable('merit_ledger_entries');
    if (!hasLedger) {
      return;
    }

    for (const value of NEW_ENTRY_TYPES) {
      await queryRunner.query(`
        DO $$
        BEGIN
          ALTER TYPE "${MERIT_LEDGER_ENTRY_TYPE_ENUM}" ADD VALUE '${value}';
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END
        $$;
      `);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    /* PostgreSQL không hỗ trợ gỡ giá trị enum an toàn */
  }
}
