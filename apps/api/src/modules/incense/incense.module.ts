import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../account/entities/account.entity';
import { AccountRepository } from '../account/repositories/account.repository';
import { MeritLedgerModule } from '../merit-ledger/merit-ledger.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StartIncenseHandler } from './commands/start-incense.handler';
import { IncenseSessionEntity } from './entities/incense-session.entity';
import { IncenseController } from './incense.controller';
import { IncenseService } from './incense.service';
import { GetActiveIncenseHandler } from './queries/get-active-incense.handler';
import { IncenseRepository } from './repositories/incense.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncenseSessionEntity, AccountEntity]),
    MeritLedgerModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [IncenseController],
  providers: [
    AccountRepository,
    IncenseRepository,
    IncenseService,
    StartIncenseHandler,
    GetActiveIncenseHandler,
  ],
  exports: [IncenseService, IncenseRepository],
})
export class IncenseModule {}
