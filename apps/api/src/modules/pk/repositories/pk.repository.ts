import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PkRoomMemberEntity } from '../entities/pk-room-member.entity';
import { PkRoomEntity } from '../entities/pk-room.entity';
import { PkRoomStatus } from '../entities/pk-room-status.enum';
import { PkTeam } from '../entities/pk-team.enum';
import { PkMode } from '../entities/pk-mode.enum';

export interface PkRoomListItemRow {
  id: string;
  roomCode: string;
  name: string;
  hasPassword: boolean;
  status: PkRoomStatus;
  mode: PkMode;
  teamSize: number;
  memberCount: number;
  createdAt: Date;
}

@Injectable()
export class PkRepository {
  constructor(
    @InjectRepository(PkRoomEntity)
    private readonly roomRepo: Repository<PkRoomEntity>,
    @InjectRepository(PkRoomMemberEntity)
    private readonly memberRepo: Repository<PkRoomMemberEntity>,
  ) {}

  createRoom(data: {
    roomCode: string;
    name: string;
    passwordHash: string | null;
    hostAccountId: string;
    teamSize: number;
    mode: PkMode;
    stakeAmount: string | null;
    durationMinutes: number;
  }): Promise<PkRoomEntity> {
    const entity = this.roomRepo.create({
      ...data,
      status: PkRoomStatus.WAITING,
    });
    return this.roomRepo.save(entity);
  }

  findRoomById(roomId: string): Promise<PkRoomEntity | null> {
    return this.roomRepo.findOne({ where: { id: roomId } });
  }

  findRoomByCode(roomCode: string): Promise<PkRoomEntity | null> {
    return this.roomRepo.findOne({ where: { roomCode } });
  }

  deleteRoom(roomId: string): Promise<void> {
    return this.roomRepo.delete(roomId) as unknown as Promise<void>;
  }

  updateRoom(
    roomId: string,
    patch: Partial<
      Pick<
        PkRoomEntity,
        | 'status'
        | 'hostAccountId'
        | 'matchStartedAt'
        | 'matchEndsAt'
      >
    >,
  ): Promise<void> {
    return this.roomRepo.update(roomId, patch) as unknown as Promise<void>;
  }

  async listActiveRooms(): Promise<PkRoomListItemRow[]> {
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
      .addSelect('room.mode', 'mode')
      .addSelect('room.teamSize', 'teamSize')
      .addSelect('room.createdAt', 'createdAt')
      .addSelect('COUNT(member.id)', 'memberCount')
      .groupBy('room.id')
      .orderBy('room.createdAt', 'DESC')
      .getRawMany<{
        id: string;
        roomCode: string;
        name: string;
        hasPassword: boolean;
        status: PkRoomStatus;
        mode: PkMode;
        teamSize: number;
        createdAt: Date;
        memberCount: string;
      }>();

    return rows.map((row) => ({
      id: row.id,
      roomCode: row.roomCode,
      name: row.name,
      hasPassword: Boolean(row.hasPassword),
      status: row.status,
      mode: row.mode,
      teamSize: row.teamSize,
      createdAt: row.createdAt,
      memberCount: Number(row.memberCount),
    }));
  }

  async findQuickJoinRoom(): Promise<PkRoomEntity | null> {
    const waiting = await this.roomRepo.findOne({
      where: { status: PkRoomStatus.WAITING },
      order: { createdAt: 'DESC' },
    });
    return waiting;
  }

  addMember(data: {
    roomId: string;
    accountId: string;
    team: PkTeam | null;
    isSpectator: boolean;
    isReady?: boolean;
  }): Promise<PkRoomMemberEntity> {
    const entity = this.memberRepo.create({
      roomId: data.roomId,
      accountId: data.accountId,
      team: data.team,
      isSpectator: data.isSpectator,
      isFighter: !data.isSpectator,
      isReady: data.isReady ?? false,
      matchMeritHits: '0',
    });
    return this.memberRepo.save(entity);
  }

  findMember(roomId: string, accountId: string): Promise<PkRoomMemberEntity | null> {
    return this.memberRepo.findOne({ where: { roomId, accountId } });
  }

  listMembers(roomId: string): Promise<PkRoomMemberEntity[]> {
    return this.memberRepo.find({
      where: { roomId },
      order: { joinedAt: 'ASC' },
    });
  }

  countMembers(roomId: string): Promise<number> {
    return this.memberRepo.count({ where: { roomId } });
  }

  countFightersByTeam(roomId: string, team: PkTeam): Promise<number> {
    return this.memberRepo.count({
      where: { roomId, team, isSpectator: false },
    });
  }

  removeMember(roomId: string, accountId: string): Promise<void> {
    return this.memberRepo.delete({ roomId, accountId }) as unknown as Promise<void>;
  }

  updateMember(
    roomId: string,
    accountId: string,
    patch: Partial<
      Pick<
        PkRoomMemberEntity,
        'team' | 'isSpectator' | 'isFighter' | 'isReady' | 'matchMeritHits'
      >
    >,
  ): Promise<void> {
    return this.memberRepo.update({ roomId, accountId }, patch) as unknown as Promise<void>;
  }

  incrementMatchMerit(roomId: string, accountId: string, delta: bigint): Promise<void> {
    return this.memberRepo
      .createQueryBuilder()
      .update()
      .set({
        matchMeritHits: () => `match_merit_hits + ${delta.toString()}`,
      })
      .where('room_id = :roomId AND account_id = :accountId', { roomId, accountId })
      .execute()
      .then(() => undefined);
  }

  resetAllMatchMerit(roomId: string): Promise<void> {
    return this.memberRepo.update({ roomId }, { matchMeritHits: '0' }) as unknown as Promise<void>;
  }

  resetFightersAfterMatch(roomId: string): Promise<void> {
    return this.memberRepo.update(
      { roomId, isFighter: true },
      { isFighter: false, isReady: false, matchMeritHits: '0' },
    ) as unknown as Promise<void>;
  }

  listActiveRoomsWithMatchEnd(): Promise<PkRoomEntity[]> {
    return this.roomRepo.find({
      where: { status: PkRoomStatus.ACTIVE },
    });
  }
}
