import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CoCultivationRoomMemberEntity } from '../entities/co-cultivation-room-member.entity';
import { CoCultivationRoomEntity } from '../entities/co-cultivation-room.entity';
import { CoCultivationRoomStatus } from '../entities/co-cultivation-room-status.enum';
import { CoCultivationSessionParticipantEntity } from '../entities/co-cultivation-session-participant.entity';
import { CoCultivationSessionEntity } from '../entities/co-cultivation-session.entity';
import { CoCultivationSessionStatus } from '../entities/co-cultivation-session-status.enum';

export interface RoomListItemRow {
  id: string;
  roomCode: string;
  name: string;
  hasPassword: boolean;
  status: CoCultivationRoomStatus;
  memberCount: number;
  createdAt: Date;
}

@Injectable()
export class CoCultivationRepository {
  constructor(
    @InjectRepository(CoCultivationRoomEntity)
    private readonly roomRepo: Repository<CoCultivationRoomEntity>,
    @InjectRepository(CoCultivationRoomMemberEntity)
    private readonly memberRepo: Repository<CoCultivationRoomMemberEntity>,
    @InjectRepository(CoCultivationSessionEntity)
    private readonly sessionRepo: Repository<CoCultivationSessionEntity>,
    @InjectRepository(CoCultivationSessionParticipantEntity)
    private readonly sessionParticipantRepo: Repository<CoCultivationSessionParticipantEntity>,
  ) {}

  createSession(data: {
    roomCode: string;
    roomName: string;
    hadPassword: boolean;
  }): Promise<CoCultivationSessionEntity> {
    const entity = this.sessionRepo.create({
      roomCode: data.roomCode,
      roomName: data.roomName,
      hadPassword: data.hadPassword,
      status: CoCultivationSessionStatus.OPEN,
    });
    return this.sessionRepo.save(entity);
  }

  closeSession(sessionId: string): Promise<void> {
    return this.sessionRepo.update(sessionId, {
      status: CoCultivationSessionStatus.CLOSED,
      endedAt: new Date(),
    }) as unknown as Promise<void>;
  }

  createRoom(data: {
    roomCode: string;
    name: string;
    passwordHash: string | null;
    hostAccountId: string;
    sessionId: string;
  }): Promise<CoCultivationRoomEntity> {
    const entity = this.roomRepo.create({
      ...data,
      status: CoCultivationRoomStatus.WAITING,
    });
    return this.roomRepo.save(entity);
  }

  findRoomById(roomId: string): Promise<CoCultivationRoomEntity | null> {
    return this.roomRepo.findOne({ where: { id: roomId } });
  }

  findRoomByCode(roomCode: string): Promise<CoCultivationRoomEntity | null> {
    return this.roomRepo.findOne({ where: { roomCode } });
  }

  deleteRoom(roomId: string): Promise<void> {
    return this.roomRepo.delete(roomId) as unknown as Promise<void>;
  }

  updateRoomStatus(roomId: string, status: CoCultivationRoomStatus): Promise<void> {
    return this.roomRepo.update(roomId, { status }) as unknown as Promise<void>;
  }

  updateHost(roomId: string, hostAccountId: string): Promise<void> {
    return this.roomRepo.update(roomId, { hostAccountId }) as unknown as Promise<void>;
  }

  async listActiveRooms(): Promise<RoomListItemRow[]> {
    const rows = await this.roomRepo
      .createQueryBuilder('room')
      .leftJoin('room.members', 'member')
      .select('room.id', 'id')
      .addSelect('room.roomCode', 'roomCode')
      .addSelect('room.name', 'name')
      .addSelect(
        'CASE WHEN room.password_hash IS NOT NULL THEN TRUE ELSE FALSE END',
        'hasPassword',
      )
      .addSelect('room.status', 'status')
      .addSelect('room.createdAt', 'createdAt')
      .addSelect('COUNT(member.id)', 'memberCount')
      .groupBy('room.id')
      .orderBy('room.createdAt', 'DESC')
      .getRawMany<{
        id: string;
        roomCode: string;
        name: string;
        hasPassword: boolean;
        status: CoCultivationRoomStatus;
        createdAt: Date;
        memberCount: string;
      }>();

    return rows.map((row) => ({
      id: row.id,
      roomCode: row.roomCode,
      name: row.name,
      hasPassword: Boolean(row.hasPassword),
      status: row.status,
      createdAt: row.createdAt,
      memberCount: Number(row.memberCount),
    }));
  }

  async findQuickJoinRoom(): Promise<CoCultivationRoomEntity | null> {
    const active = await this.roomRepo.findOne({
      where: { status: CoCultivationRoomStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
    if (active) {
      return active;
    }

    const waitingWithReady = await this.roomRepo
      .createQueryBuilder('room')
      .innerJoin('room.members', 'member', 'member.isReady = true')
      .where('room.status = :status', { status: CoCultivationRoomStatus.WAITING })
      .orderBy('room.createdAt', 'DESC')
      .getOne();
    if (waitingWithReady) {
      return waitingWithReady;
    }

    return this.roomRepo.findOne({
      where: { status: CoCultivationRoomStatus.WAITING },
      order: { createdAt: 'DESC' },
    });
  }

  addMember(roomId: string, accountId: string): Promise<CoCultivationRoomMemberEntity> {
    const entity = this.memberRepo.create({
      roomId,
      accountId,
      isReady: false,
      isParticipating: false,
      personalMeritHits: '0',
    });
    return this.memberRepo.save(entity);
  }

  findMember(roomId: string, accountId: string): Promise<CoCultivationRoomMemberEntity | null> {
    return this.memberRepo.findOne({ where: { roomId, accountId } });
  }

  listMembers(roomId: string): Promise<CoCultivationRoomMemberEntity[]> {
    return this.memberRepo.find({
      where: { roomId },
      order: { joinedAt: 'ASC' },
    });
  }

  countMembers(roomId: string): Promise<number> {
    return this.memberRepo.count({ where: { roomId } });
  }

  removeMember(roomId: string, accountId: string): Promise<void> {
    return this.memberRepo.delete({ roomId, accountId }) as unknown as Promise<void>;
  }

  updateMember(
    roomId: string,
    accountId: string,
    patch: Partial<
      Pick<CoCultivationRoomMemberEntity, 'isReady' | 'isParticipating' | 'personalMeritHits'>
    >,
  ): Promise<void> {
    return this.memberRepo.update({ roomId, accountId }, patch) as unknown as Promise<void>;
  }

  incrementMemberHits(roomId: string, accountId: string, delta: bigint): Promise<void> {
    return this.memberRepo
      .createQueryBuilder()
      .update()
      .set({
        personalMeritHits: () => `personal_merit_hits + ${delta.toString()}`,
      })
      .where('room_id = :roomId AND account_id = :accountId', { roomId, accountId })
      .execute()
      .then(() => undefined);
  }

  addSessionParticipant(data: {
    sessionId: string;
    accountId: string;
    nickname: string;
  }): Promise<CoCultivationSessionParticipantEntity> {
    const entity = this.sessionParticipantRepo.create({
      sessionId: data.sessionId,
      accountId: data.accountId,
      nickname: data.nickname,
      personalMeritHits: '0',
      bonusMeritReceived: '0',
    });
    return this.sessionParticipantRepo.save(entity);
  }

  findOpenSessionParticipant(
    sessionId: string,
    accountId: string,
  ): Promise<CoCultivationSessionParticipantEntity | null> {
    return this.sessionParticipantRepo.findOne({
      where: { sessionId, accountId, leftAt: IsNull() },
    });
  }

  markSessionParticipantLeft(sessionId: string, accountId: string): Promise<void> {
    return this.sessionParticipantRepo.update(
      { sessionId, accountId, leftAt: IsNull() },
      { leftAt: new Date() },
    ) as unknown as Promise<void>;
  }

  incrementSessionParticipantStats(
    sessionId: string,
    accountId: string,
    personalDelta: bigint,
    bonusDelta: bigint,
  ): Promise<void> {
    return this.sessionParticipantRepo
      .createQueryBuilder()
      .update()
      .set({
        personalMeritHits: () => `personal_merit_hits + ${personalDelta.toString()}`,
        bonusMeritReceived: () => `bonus_merit_received + ${bonusDelta.toString()}`,
      })
      .where('session_id = :sessionId AND account_id = :accountId AND left_at IS NULL', {
        sessionId,
        accountId,
      })
      .execute()
      .then(() => undefined);
  }
}
