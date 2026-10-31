import { MigrationInterface, QueryRunner } from 'typeorm';
import { MERIT_LEDGER_ENTRY_TYPE_ENUM } from './helpers/merit-ledger.schema';

const NEW_ENTRY_TYPES = ['song_tu_hit', 'song_tu_bonus'] as const;

export class MeritLedgerSongTuTypes1730600000000 implements MigrationInterface {
  name = 'MeritLedgerSongTuTypes1730600000000';

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
