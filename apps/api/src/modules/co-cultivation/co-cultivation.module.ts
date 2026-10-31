import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountModule } from '../account/account.module';
import { IncenseModule } from '../incense/incense.module';
import { MeritLedgerModule } from '../merit-ledger/merit-ledger.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CoCultivationMokBufferService } from './co-cultivation-mok-buffer.service';
import { CoCultivationPresenceService } from './co-cultivation-presence.service';
import { CoCultivationController } from './co-cultivation.controller';
import { CoCultivationGateway } from './co-cultivation.gateway';
import { CoCultivationService } from './co-cultivation.service';
import { CoCultivationRoomMemberEntity } from './entities/co-cultivation-room-member.entity';
import { CoCultivationRoomEntity } from './entities/co-cultivation-room.entity';
import { CoCultivationSessionParticipantEntity } from './entities/co-cultivation-session-participant.entity';
import { CoCultivationSessionEntity } from './entities/co-cultivation-session.entity';
import { CoCultivationRepository } from './repositories/co-cultivation.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoCultivationRoomEntity,
      CoCultivationRoomMemberEntity,
      CoCultivationSessionEntity,
      CoCultivationSessionParticipantEntity,
    ]),
    AccountModule,
    MeritLedgerModule,
    IncenseModule,
    RealtimeModule,
  ],
  controllers: [CoCultivationController],
  providers: [
    CoCultivationRepository,
    CoCultivationService,
    CoCultivationMokBufferService,
    CoCultivationPresenceService,
    CoCultivationGateway,
  ],
  exports: [CoCultivationService, CoCultivationPresenceService],
})
export class CoCultivationModule {}
