import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from 'typeorm';
import { createMeritLedgerTables, dropMeritLedgerTables } from './helpers/merit-ledger.schema';

export class InitSchema1730217600000 implements MigrationInterface {
  name = 'InitSchema1730217600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'device_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_accounts_device_id',
            columnNames: ['device_id'],
          }),
        ],
      }),
      true,
    );

    await createMeritLedgerTables(queryRunner);

    await queryRunner.createTable(
      new Table({
        name: 'incense_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'started_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'ends_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'last_credited_at',
            type: 'timestamptz',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'incense_sessions',
      new TableForeignKey({
        name: 'FK_incense_sessions_account',
        columnNames: ['account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'incense_sessions',
      new TableIndex({
        name: 'IDX_incense_sessions_account_active',
        columnNames: ['account_id', 'is_active'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'merit_transfers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'sender_account_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'receiver_account_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'completed', 'cancelled'],
            enumName: 'merit_transfers_status_enum',
            default: `'pending'::"merit_transfers_status_enum"`,
            isNullable: false,
          },
          {
            name: 'transaction_code',
            type: 'varchar',
            length: '8',
            isNullable: false,
          },
          {
            name: 'confirmation_code',
            type: 'varchar',
            length: '6',
            isNullable: false,
          },
          {
            name: 'sender_confirmed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'receiver_confirmed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_merit_transfers_transaction_code',
            columnNames: ['transaction_code'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('merit_transfers', [
      new TableForeignKey({
        name: 'FK_merit_transfers_sender',
        columnNames: ['sender_account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'FK_merit_transfers_receiver',
        columnNames: ['receiver_account_id'],
        referencedTableName: 'accounts',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const transfersTable = await queryRunner.getTable('merit_transfers');
    if (transfersTable) {
      await queryRunner.dropTable(transfersTable, true, true, true);
    }
    const incenseTable = await queryRunner.getTable('incense_sessions');
    if (incenseTable) {
      await queryRunner.dropTable(incenseTable, true, true, true);
    }

    await dropMeritLedgerTables(queryRunner);

    const accountsTable = await queryRunner.getTable('accounts');
    if (accountsTable) {
      await queryRunner.dropTable(accountsTable, true, true, true);
    }
  }
}
