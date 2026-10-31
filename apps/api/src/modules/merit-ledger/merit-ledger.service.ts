import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MeritLedgerEntryType } from './entities/merit-ledger-entry-type.enum';
import { MeritLedgerRepository, PostLedgerLineInput } from './repositories/merit-ledger.repository';

@Injectable()
export class MeritLedgerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly meritLedgerRepository: MeritLedgerRepository,
  ) {}

  async ensureBalanceRow(accountId: string): Promise<void> {
    const existing = await this.meritLedgerRepository.findBalance(accountId);
    if (!existing) {
      await this.meritLedgerRepository.createZeroBalance(accountId);
    }
  }

  async getBalance(accountId: string): Promise<string> {
    const row = await this.meritLedgerRepository.findBalance(accountId);
    return row?.balance ?? '0';
  }

  async postCredit(
    accountId: string,
    amount: bigint,
    entryType: MeritLedgerEntryType,
    referenceId?: string | null,
  ): Promise<string> {
    if (amount <= 0n) {
      throw new BadRequestException('Số công đức ghi có phải lớn hơn 0');
    }
    const balances = await this.postLines([
      { accountId, amount, entryType, referenceId },
    ]);
    return balances.get(accountId) ?? (await this.getBalance(accountId));
  }

  async postDebit(
    accountId: string,
    amount: bigint,
    entryType: MeritLedgerEntryType,
    referenceId?: string | null,
  ): Promise<string> {
    if (amount <= 0n) {
      throw new BadRequestException('Số công đức ghi nợ phải lớn hơn 0');
    }
    const balances = await this.postLines([{ accountId, amount: -amount, entryType, referenceId }]);
    return balances.get(accountId) ?? (await this.getBalance(accountId));
  }

  async postTransfer(
    senderAccountId: string,
    receiverAccountId: string,
    amount: bigint,
    transferId: string,
  ): Promise<{ senderBalance: string; receiverBalance: string }> {
    if (amount <= 0n) {
      throw new BadRequestException('Số công đức chuyển phải lớn hơn 0');
    }

    const balances = await this.postLines([
      {
        accountId: senderAccountId,
        amount: -amount,
        entryType: MeritLedgerEntryType.TRANSFER_OUT,
        referenceId: transferId,
      },
      {
        accountId: receiverAccountId,
        amount,
        entryType: MeritLedgerEntryType.TRANSFER_IN,
        referenceId: transferId,
      },
    ]);

    const senderBalance = balances.get(senderAccountId);
    const receiverBalance = balances.get(receiverAccountId);
    if (senderBalance === undefined || receiverBalance === undefined) {
      throw new BadRequestException('Không đủ công đức để chuyển');
    }

    return { senderBalance, receiverBalance };
  }

  private async postLines(lines: PostLedgerLineInput[]): Promise<Map<string, string>> {
    return this.dataSource.transaction((manager) =>
      this.meritLedgerRepository.appendEntries(manager, lines),
    );
  }
}
