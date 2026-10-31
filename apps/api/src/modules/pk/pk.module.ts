import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountModule } from '../account/account.module';
import { CoCultivationModule } from '../co-cultivation/co-cultivation.module';
import { MeritLedgerModule } from '../merit-ledger/merit-ledger.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PkRoomMemberEntity } from './entities/pk-room-member.entity';
import { PkRoomEntity } from './entities/pk-room.entity';
import { PkMokBufferService } from './pk-mok-buffer.service';
import { PkController } from './pk.controller';
import { PkGateway } from './pk.gateway';
import { PkService } from './pk.service';
import { PkRepository } from './repositories/pk.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PkRoomEntity, PkRoomMemberEntity]),
    AccountModule,
    MeritLedgerModule,
    RealtimeModule,
    CoCultivationModule,
  ],
  controllers: [PkController],
  providers: [PkRepository, PkService, PkMokBufferService, PkGateway],
  exports: [PkService],
})
export class PkModule {}
