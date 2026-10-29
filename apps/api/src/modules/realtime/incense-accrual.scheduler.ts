import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AccountRepository } from '../account/repositories/account.repository';
import { IncenseRepository } from '../incense/repositories/incense.repository';
import { IncenseService } from '../incense/incense.service';
import { RealtimeGateway } from './realtime.gateway';

/** Ghi sổ công đức nhang và đẩy socket — mỗi phút, trên server. */
const ACCRUAL_INTERVAL_MS = 60_000;

@Injectable()
export class IncenseAccrualScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IncenseAccrualScheduler.name);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly incenseRepository: IncenseRepository,
    private readonly incenseService: IncenseService,
    private readonly accountRepository: AccountRepository,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.runAccrualTick();
    }, ACCRUAL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async runAccrualTick(): Promise<void> {
    const sessions = await this.incenseRepository.findAllActive();
    for (const session of sessions) {
      try {
        await this.incenseService.creditPendingMerit(session.accountId);
        const account = await this.accountRepository.findById(session.accountId);
        if (!account) {
          continue;
        }
        await this.realtimeGateway.pushIncenseState(account.deviceId);
      } catch (err) {
        this.logger.warn(
          `Incense accrual failed for account ${session.accountId}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
