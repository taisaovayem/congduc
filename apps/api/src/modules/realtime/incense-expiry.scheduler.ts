import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AccountRepository } from '../account/repositories/account.repository';
import { IncenseRepository } from '../incense/repositories/incense.repository';
import { IncenseService } from '../incense/incense.service';
import { RealtimeGateway } from './realtime.gateway';

/** Phát hiện nhang vừa tắt và đẩy socket — không thay thế accrual mỗi phút. */
const EXPIRY_CHECK_INTERVAL_MS = 5_000;

@Injectable()
export class IncenseExpiryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IncenseExpiryScheduler.name);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly incenseRepository: IncenseRepository,
    private readonly incenseService: IncenseService,
    private readonly accountRepository: AccountRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.runExpiryCheck();
    }, EXPIRY_CHECK_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async runExpiryCheck(): Promise<void> {
    const sessions = await this.incenseRepository.findAllActive();
    const now = Date.now();

    for (const session of sessions) {
      if (session.endsAt.getTime() > now) {
        continue;
      }
      try {
        await this.incenseService.finalizeIfExpired(session.accountId);
        const account = await this.accountRepository.findById(session.accountId);
        if (!account) {
          continue;
        }
        await this.realtimeGateway.pushIncenseState(account.deviceId);
      } catch (err) {
        this.logger.warn(
          `Incense expiry sync failed for account ${session.accountId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
