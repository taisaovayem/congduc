import {
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';
import { AccountMeritBalanceEntity } from '../../../modules/merit-ledger/entities/account-merit-balance.entity';
import { MeritLedgerEntryEntity } from '../../../modules/merit-ledger/entities/merit-ledger-entry.entity';
import { MeritLedgerEntryType } from '../../../modules/merit-ledger/entities/merit-ledger-entry-type.enum';

export const MERIT_LEDGER_ENTRY_TYPE_ENUM = 'merit_ledger_entry_type_enum';

export const MERIT_LEDGER_ENTRY_TYPES = [
  'opening',
  'mok_hit',
  'incense_accrual',
  'transfer_out',
  'transfer_in',
  'song_tu_hit',
  'song_tu_bonus',
] as const;

export async function createMeritLedgerTables(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.createTable(
    new Table({
      name: 'merit_ledger_entries',
      columns: [
        {
          name: 'id',
          type: 'bigint',
          isPrimary: true,
          isGenerated: true,
          generationStrategy: 'increment',
        },
        {
          name: 'account_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'amount',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'entry_type',
          type: 'enum',
          enum: [...MERIT_LEDGER_ENTRY_TYPES],
          enumName: MERIT_LEDGER_ENTRY_TYPE_ENUM,
          isNullable: false,
        },
        {
          name: 'reference_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'balance_after',
          type: 'bigint',
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
    'merit_ledger_entries',
    new TableForeignKey({
      name: 'FK_merit_ledger_entries_account',
      columnNames: ['account_id'],
      referencedTableName: 'accounts',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }),
  );

  await queryRunner.createTable(
    new Table({
      name: 'account_merit_balances',
      columns: [
        {
          name: 'account_id',
          type: 'uuid',
          isPrimary: true,
          isNullable: false,
        },
        {
          name: 'balance',
          type: 'bigint',
          default: '0',
          isNullable: false,
        },
        {
          name: 'last_ledger_id',
          type: 'bigint',
          isNullable: true,
        },
        {
          name: 'updated_at',
          type: 'timestamptz',
          default: 'now()',
          isNullable: false,
        },
      ],
    }),
    true,
  );

  await queryRunner.createForeignKeys('account_merit_balances', [
    new TableForeignKey({
      name: 'FK_account_merit_balances_account',
      columnNames: ['account_id'],
      referencedTableName: 'accounts',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }),
    new TableForeignKey({
      name: 'FK_account_merit_balances_last_ledger',
      columnNames: ['last_ledger_id'],
      referencedTableName: 'merit_ledger_entries',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }),
  ]);

  await queryRunner.createIndex(
    'merit_ledger_entries',
    new TableIndex({
      name: 'IDX_merit_ledger_entries_account_created',
      columnNames: ['account_id', 'created_at'],
    }),
  );
}

export async function dropMeritLedgerTables(queryRunner: QueryRunner): Promise<void> {
  const balancesTable = await queryRunner.getTable('account_merit_balances');
  if (balancesTable) {
    await queryRunner.dropTable(balancesTable, true, true, true);
  }

  const ledgerTable = await queryRunner.getTable('merit_ledger_entries');
  if (ledgerTable) {
    await queryRunner.dropTable(ledgerTable, true, true, true);
  }
}

export async function migrateLegacyMeritPointsToLedger(queryRunner: QueryRunner): Promise<void> {
  type LegacyAccountRow = {
    id: string;
    merit_points: string;
    created_at: Date;
  };

  const accounts = await queryRunner.manager
    .createQueryBuilder()
    .select('a.id', 'id')
    .addSelect('a.merit_points', 'merit_points')
    .addSelect('a.created_at', 'created_at')
    .from('accounts', 'a')
    .getRawMany<LegacyAccountRow>();

  if (accounts.length === 0) {
    return;
  }

  await queryRunner.manager.insert(
    AccountMeritBalanceEntity,
    accounts.map((account) => ({
      accountId: account.id,
      balance: account.merit_points,
    })),
  );

  const nonZeroAccounts = accounts.filter((account) => BigInt(account.merit_points) !== 0n);
  for (const account of nonZeroAccounts) {
    const insertResult = await queryRunner.manager.insert(MeritLedgerEntryEntity, {
      accountId: account.id,
      amount: account.merit_points,
      entryType: MeritLedgerEntryType.OPENING,
      referenceId: null,
      balanceAfter: account.merit_points,
      createdAt: account.created_at,
    });

    const ledgerId = insertResult.identifiers[0]?.id as string | undefined;
    if (!ledgerId) {
      continue;
    }

    await queryRunner.manager.update(
      AccountMeritBalanceEntity,
      { accountId: account.id },
      { lastLedgerId: ledgerId },
    );
  }
}

export async function restoreLegacyMeritPointsColumn(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.addColumn(
    'accounts',
    new TableColumn({
      name: 'merit_points',
      type: 'bigint',
      default: '0',
      isNullable: false,
    }),
  );

  const balances = await queryRunner.manager.find(AccountMeritBalanceEntity);
  for (const balance of balances) {
    await queryRunner.manager
      .createQueryBuilder()
      .update('accounts')
      .set({ merit_points: balance.balance })
      .where('id = :id', { id: balance.accountId })
      .execute();
  }
}
