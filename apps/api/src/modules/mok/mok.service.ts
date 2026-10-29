import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AccountService } from '../account/account.service';
import { IncenseService } from '../incense/incense.service';
import { MeritLedgerEntryType } from '../merit-ledger/entities/merit-ledger-entry-type.enum';
import { MeritLedgerService } from '../merit-ledger/merit-ledger.service';

/** Gom số lần gõ mõ trước khi ghi một dòng sổ cái. */
const MOK_FLUSH_DEBOUNCE_MS = 1_000;

interface MokHitBuffer {
  pendingHits: number;
  flushTimer: ReturnType<typeof setTimeout> | null;
}

@Injectable()
export class MokService implements OnModuleDestroy {
  private readonly buffers = new Map<string, MokHitBuffer>();

  constructor(
    private readonly accountService: AccountService,
    private readonly incenseService: IncenseService,
    private readonly meritLedgerService: MeritLedgerService,
  ) {}

  onModuleDestroy(): void {
    for (const buffer of this.buffers.values()) {
      if (buffer.flushTimer) {
        clearTimeout(buffer.flushTimer);
      }
    }
    this.buffers.clear();
  }

  /** Socket gọi liên tục; trả số dư optimistic, ghi DB theo batch. */
  async registerHit(deviceId: string): Promise<{ meritPoints: string }> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const buffer = this.getOrCreateBuffer(deviceId);
    buffer.pendingHits += 1;
    this.scheduleFlush(deviceId, buffer);

    const base = BigInt(await this.meritLedgerService.getBalance(account.id));
    return { meritPoints: (base + BigInt(buffer.pendingHits)).toString() };
  }

  private getOrCreateBuffer(deviceId: string): MokHitBuffer {
    let buffer = this.buffers.get(deviceId);
    if (!buffer) {
      buffer = { pendingHits: 0, flushTimer: null };
      this.buffers.set(deviceId, buffer);
    }
    return buffer;
  }

  private scheduleFlush(deviceId: string, buffer: MokHitBuffer): void {
    if (buffer.flushTimer) {
      return;
    }
    buffer.flushTimer = setTimeout(() => {
      void this.flushHits(deviceId);
    }, MOK_FLUSH_DEBOUNCE_MS);
  }

  private async flushHits(deviceId: string): Promise<void> {
    const buffer = this.buffers.get(deviceId);
    if (!buffer) {
      return;
    }

    buffer.flushTimer = null;
    const hits = buffer.pendingHits;
    buffer.pendingHits = 0;

    if (hits <= 0) {
      return;
    }

    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    await this.incenseService.creditPendingMerit(account.id);
    await this.meritLedgerService.postCredit(
      account.id,
      BigInt(hits),
      MeritLedgerEntryType.MOK_HIT,
    );
  }
}
