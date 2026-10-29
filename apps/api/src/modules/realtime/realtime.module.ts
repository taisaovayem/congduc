import { Module, forwardRef } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { IncenseModule } from '../incense/incense.module';
import { MeritLedgerModule } from '../merit-ledger/merit-ledger.module';
import { MokService } from '../mok/mok.service';
import { HitMokHandler } from '../mok/commands/hit-mok.handler';
import { IncenseAccrualScheduler } from './incense-accrual.scheduler';
import { RealtimeGateway } from './realtime.gateway';
import { WsDeviceIdGuard } from './ws-device-id.guard';

@Module({
  imports: [forwardRef(() => AccountModule), forwardRef(() => IncenseModule), MeritLedgerModule],
  providers: [
    RealtimeGateway,
    IncenseAccrualScheduler,
    WsDeviceIdGuard,
    MokService,
    HitMokHandler,
  ],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
