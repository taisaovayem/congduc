import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountModule } from '../account/account.module';
import { MeritLedgerModule } from '../merit-ledger/merit-ledger.module';
import { IncenseModule } from '../incense/incense.module';
import { ConfirmTransferHandler } from './commands/confirm-transfer.handler';
import { CreateSendTransferHandler } from './commands/create-send-transfer.handler';
import { JoinReceiveTransferHandler } from './commands/join-receive-transfer.handler';
import { TransferEntity } from './entities/transfer.entity';
import { TransferRepository } from './repositories/transfer.repository';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransferEntity]), AccountModule, MeritLedgerModule, IncenseModule],
  controllers: [TransferController],
  providers: [
    TransferRepository,
    TransferService,
    CreateSendTransferHandler,
    JoinReceiveTransferHandler,
    ConfirmTransferHandler,
  ],
})
export class TransferModule {}
