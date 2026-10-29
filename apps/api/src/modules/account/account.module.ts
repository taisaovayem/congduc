import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncenseModule } from '../incense/incense.module';
import { MeritLedgerModule } from '../merit-ledger/merit-ledger.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { EnsureSessionHandler } from './commands/ensure-session.handler';
import { AccountEntity } from './entities/account.entity';
import { GetAccountProfileHandler } from './queries/get-account-profile.handler';
import { AccountRepository } from './repositories/account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity]), MeritLedgerModule, IncenseModule],
  controllers: [AccountController],
  providers: [
    AccountRepository,
    AccountService,
    EnsureSessionHandler,
    GetAccountProfileHandler,
  ],
  exports: [AccountRepository, AccountService],
})
export class AccountModule {}
