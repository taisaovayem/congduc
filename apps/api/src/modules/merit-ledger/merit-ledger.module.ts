import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountMeritBalanceEntity } from './entities/account-merit-balance.entity';
import { MeritLedgerEntryEntity } from './entities/merit-ledger-entry.entity';
import { MeritLedgerService } from './merit-ledger.service';
import { MeritLedgerRepository } from './repositories/merit-ledger.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MeritLedgerEntryEntity, AccountMeritBalanceEntity])],
  providers: [MeritLedgerRepository, MeritLedgerService],
  exports: [MeritLedgerService, MeritLedgerRepository],
})
export class MeritLedgerModule {}
