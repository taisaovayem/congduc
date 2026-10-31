import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AccountMeritBalanceEntity } from '../entities/account-merit-balance.entity';
import { MeritLedgerEntryEntity } from '../entities/merit-ledger-entry.entity';
import { MeritLedgerEntryType } from '../entities/merit-ledger-entry-type.enum';

export interface PostLedgerLineInput {
  accountId: string;
  amount: bigint;
  entryType: MeritLedgerEntryType;
  referenceId?: string | null;
}

@Injectable()
export class MeritLedgerRepository {
  constructor(
    @InjectRepository(MeritLedgerEntryEntity)
    private readonly entryRepo: Repository<MeritLedgerEntryEntity>,
    @InjectRepository(AccountMeritBalanceEntity)
    private readonly balanceRepo: Repository<AccountMeritBalanceEntity>,
  ) {}

  findBalance(accountId: string): Promise<AccountMeritBalanceEntity | null> {
    return this.balanceRepo.findOne({ where: { accountId } });
  }

  createZeroBalance(accountId: string, manager?: EntityManager): Promise<AccountMeritBalanceEntity> {
    const repo = manager ? manager.getRepository(AccountMeritBalanceEntity) : this.balanceRepo;
    const row = repo.create({ accountId, balance: '0', lastLedgerId: null });
    return repo.save(row);
  }

  async lockAccounts(manager: EntityManager, accountIds: string[]): Promise<void> {
    const unique = [...new Set(accountIds)].sort();
    for (const accountId of unique) {
      await manager.query(`SELECT id FROM accounts WHERE id = $1 FOR UPDATE`, [accountId]);
    }
  }

  async getBalanceForUpdate(
    manager: EntityManager,
    accountId: string,
  ): Promise<AccountMeritBalanceEntity> {
    const repo = manager.getRepository(AccountMeritBalanceEntity);
    let row = await repo.findOne({
      where: { accountId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!row) {
      row = await repo.save(repo.create({ accountId, balance: '0', lastLedgerId: null }));
      row = await repo.findOneOrFail({
        where: { accountId },
        lock: { mode: 'pessimistic_write' },
      });
    }
    return row;
  }

  async appendEntries(
    manager: EntityManager,
    lines: PostLedgerLineInput[],
  ): Promise<Map<string, string>> {
    if (lines.length === 0) {
      return new Map();
    }

    await this.lockAccounts(
      manager,
      lines.map((l) => l.accountId),
    );

    const balanceAfterByAccount = new Map<string, string>();
    const entryRepo = manager.getRepository(MeritLedgerEntryEntity);
    const balanceRepo = manager.getRepository(AccountMeritBalanceEntity);

    for (const line of lines) {
      if (line.amount === 0n) {
        continue;
      }

      const balanceRow = await this.getBalanceForUpdate(manager, line.accountId);
      const current = BigInt(balanceRow.balance);
      const next = current + line.amount;

      const saved = await entryRepo.save(
        entryRepo.create({
          accountId: line.accountId,
          amount: line.amount.toString(),
          entryType: line.entryType,
          referenceId: line.referenceId ?? null,
          balanceAfter: next.toString(),
        }),
      );

      balanceRow.balance = next.toString();
      balanceRow.lastLedgerId = saved.id;
      await balanceRepo.save(balanceRow);
      balanceAfterByAccount.set(line.accountId, next.toString());
    }

    return balanceAfterByAccount;
  }
}
