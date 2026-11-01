import { Injectable } from '@nestjs/common';
import { MeritLedgerEntryType } from '../merit-ledger/entities/merit-ledger-entry-type.enum';
import { MeritLedgerService } from '../merit-ledger/merit-ledger.service';
import { IncenseRealtimePayload } from '../realtime/realtime.types';
import { IncenseRepository } from './repositories/incense.repository';
import { IncenseSessionEntity } from './entities/incense-session.entity';

const INCENSE_DURATION_MS = 10 * 60 * 1000;

export interface ActiveIncenseView {
  id: string;
  startedAt: Date;
  endsAt: Date;
  remainingSeconds: number;
}

export type IncenseMeritCreditListener = (accountId: string, amount: number) => void;

@Injectable()
export class IncenseService {
  private meritCreditListener: IncenseMeritCreditListener | null = null;

  constructor(
    private readonly incenseRepository: IncenseRepository,
    private readonly meritLedgerService: MeritLedgerService,
  ) {}

  setMeritCreditListener(listener: IncenseMeritCreditListener | null): void {
    this.meritCreditListener = listener;
  }

  /** Số giây công đức vừa ghi sổ (0 nếu không có). */
  async creditPendingMerit(accountId: string): Promise<number> {
    const session = await this.incenseRepository.findActiveByAccountId(accountId);
    if (!session) {
      return 0;
    }

    const now = new Date();
    const creditUntil = now < session.endsAt ? now : session.endsAt;
    const elapsedSeconds = Math.floor(
      (creditUntil.getTime() - session.lastCreditedAt.getTime()) / 1000,
    );

    if (elapsedSeconds <= 0) {
      if (now >= session.endsAt) {
        await this.incenseRepository.deactivate(session.id);
      }
      return 0;
    }

    await this.meritLedgerService.postCredit(
      accountId,
      BigInt(elapsedSeconds),
      MeritLedgerEntryType.INCENSE_ACCRUAL,
      session.id,
    );

    session.lastCreditedAt = new Date(
      session.lastCreditedAt.getTime() + elapsedSeconds * 1000,
    );
    await this.incenseRepository.save(session);

    if (now >= session.endsAt) {
      await this.incenseRepository.deactivate(session.id);
    }

    this.meritCreditListener?.(accountId, elapsedSeconds);
    return elapsedSeconds;
  }

  async startIncense(accountId: string): Promise<ActiveIncenseView> {
    await this.creditPendingMerit(accountId);

    const existing = await this.incenseRepository.findActiveByAccountId(accountId);
    if (existing) {
      return this.toView(existing);
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + INCENSE_DURATION_MS);
    const session = await this.incenseRepository.createSession({
      accountId,
      startedAt,
      endsAt,
      lastCreditedAt: startedAt,
    });

    return this.toView(session);
  }

  async getActiveIncense(accountId: string): Promise<ActiveIncenseView | null> {
    const session = await this.incenseRepository.findActiveByAccountId(accountId);
    if (!session) {
      return null;
    }
    return this.toView(session);
  }

  /** Kết thúc session nếu đã hết giờ (ghi nốt công đức còn lại). */
  async finalizeIfExpired(accountId: string): Promise<number> {
    const session = await this.incenseRepository.findActiveByAccountId(accountId);
    if (!session) {
      return 0;
    }
    if (new Date() >= session.endsAt) {
      return this.creditPendingMerit(accountId);
    }
    return 0;
  }

  /** Trạng thái nhang + công đức hiển thị (tính trên server, chưa ghi sổ phần giây chờ). */
  async getRealtimeState(accountId: string): Promise<IncenseRealtimePayload> {
    await this.finalizeIfExpired(accountId); // ghi nốt công đức nếu hết giờ

    const balance = BigInt(await this.meritLedgerService.getBalance(accountId));
    const session = await this.incenseRepository.findActiveByAccountId(accountId);
    if (!session) {
      return {
        active: false,
        remainingSeconds: 0,
        meritPoints: balance.toString(),
      };
    }

    const now = new Date();
    if (now >= session.endsAt) {
      return {
        active: false,
        remainingSeconds: 0,
        meritPoints: balance.toString(),
      };
    }

    const pendingSeconds = this.computePendingCreditSeconds(session, now);
    const remainingMs = session.endsAt.getTime() - now.getTime();

    return {
      active: true,
      remainingSeconds: Math.max(0, Math.ceil(remainingMs / 1000)),
      meritPoints: (balance + BigInt(pendingSeconds)).toString(),
      startedAt: session.startedAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
    };
  }

  private computePendingCreditSeconds(session: IncenseSessionEntity, now: Date): number {
    const creditUntil = now < session.endsAt ? now : session.endsAt;
    return Math.max(
      0,
      Math.floor((creditUntil.getTime() - session.lastCreditedAt.getTime()) / 1000),
    );
  }

  private toView(session: {
    id: string;
    startedAt: Date;
    endsAt: Date;
  }): ActiveIncenseView {
    const now = Date.now();
    const remainingMs = Math.max(0, session.endsAt.getTime() - now);
    return {
      id: session.id,
      startedAt: session.startedAt,
      endsAt: session.endsAt,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    };
  }
}
