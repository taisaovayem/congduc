import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { generateTransactionCode } from '../../common/utils/code.util';
import { isCoCultivationRoomMissingError } from '../../common/utils/pg-error.util';
import { AccountService } from '../account/account.service';
import { AccountRepository } from '../account/repositories/account.repository';
import { IncenseService } from '../incense/incense.service';
import { MeritLedgerEntryType } from '../merit-ledger/entities/merit-ledger-entry-type.enum';
import { MeritLedgerService } from '../merit-ledger/merit-ledger.service';
import { CoCultivationMokBufferService } from './co-cultivation-mok-buffer.service';
import { pickRandomRoomName, SONG_TU_BONUS_RATE } from './co-cultivation.constants';
import {
  CoCultivationRoomListItem,
  CoCultivationRoomView,
} from './co-cultivation.types';
import { CoCultivationRoomStatus } from './entities/co-cultivation-room-status.enum';
import { CoCultivationRepository } from './repositories/co-cultivation.repository';
import { hashRoomPassword, verifyRoomPassword } from './utils/room-password.util';

export type RoomStateListener = (roomId: string) => void;
export type MeritPopListener = (roomId: string, accountId: string, amount: number) => void;
export type TeamMeritListener = (roomId: string, teamMeritHits: string) => void;

@Injectable()
export class CoCultivationService implements OnModuleInit {
  private roomStateListener: RoomStateListener | null = null;
  private meritPopListener: MeritPopListener | null = null;
  private teamMeritListener: TeamMeritListener | null = null;

  /** Optimistic pending hits before ledger flush (per device in room). */
  private readonly pendingOwnHits = new Map<string, number>();

  constructor(
    private readonly repository: CoCultivationRepository,
    private readonly accountService: AccountService,
    private readonly accountRepository: AccountRepository,
    private readonly meritLedgerService: MeritLedgerService,
    private readonly incenseService: IncenseService,
    private readonly mokBuffer: CoCultivationMokBufferService,
  ) {}

  onModuleInit(): void {
    this.mokBuffer.setFlushHandler((payload) => this.flushBlock(payload.roomId, payload.hitsByAccount));
  }

  setRoomStateListener(listener: RoomStateListener | null): void {
    this.roomStateListener = listener;
  }

  setMeritPopListener(listener: MeritPopListener | null): void {
    this.meritPopListener = listener;
  }

  setTeamMeritListener(listener: TeamMeritListener | null): void {
    this.teamMeritListener = listener;
  }

  async listRooms(): Promise<CoCultivationRoomListItem[]> {
    const rows = await this.repository.listActiveRooms();
    return rows.map((row) => ({
      id: row.id,
      roomCode: row.roomCode,
      name: row.name,
      hasPassword: row.hasPassword,
      status: row.status,
      memberCount: row.memberCount,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createRoom(
    deviceId: string,
    input: { name?: string; password?: string },
  ): Promise<CoCultivationRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const roomCode = await this.generateUniqueRoomCode();
    const name = input.name?.trim() || pickRandomRoomName();
    const password = input.password?.trim();
    const passwordHash = password ? hashRoomPassword(password) : null;

    const session = await this.repository.createSession({
      roomCode,
      roomName: name,
      hadPassword: Boolean(passwordHash),
    });

    const room = await this.repository.createRoom({
      roomCode,
      name,
      passwordHash,
      hostAccountId: account.id,
      sessionId: session.id,
    });

    await this.repository.addMember(room.id, account.id);
    await this.repository.updateMember(room.id, account.id, { isReady: true });
    await this.ensureSessionParticipant(session.id, account.id, account.nickname);

    return this.buildRoomView(room.id, account.id);
  }

  async joinRoomByCode(
    deviceId: string,
    roomCode: string,
    password?: string,
  ): Promise<CoCultivationRoomView> {
    const room = await this.repository.findRoomByCode(roomCode.toUpperCase());
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    await this.verifyPassword(room.passwordHash, password);
    return this.joinRoom(deviceId, room.id, password);
  }

  async joinRoom(
    deviceId: string,
    roomId: string,
    password?: string,
  ): Promise<CoCultivationRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);

    const existing = await this.repository.findMember(roomId, account.id);
    if (!existing) {
      await this.verifyPassword(room.passwordHash, password);
      const roomStillOpen = await this.repository.findRoomById(roomId);
      if (!roomStillOpen) {
        throw new NotFoundException('Phòng không còn tồn tại');
      }

      let joinedNow = false;
      try {
        await this.repository.addMember(roomId, account.id);
        joinedNow = true;
      } catch (error) {
        const raced = await this.repository.findMember(roomId, account.id);
        if (raced) {
          joinedNow = false;
        } else if (isCoCultivationRoomMissingError(error)) {
          throw new NotFoundException('Phòng không còn tồn tại');
        } else {
          throw error;
        }
      }

      if (joinedNow) {
        await this.ensureSessionParticipant(room.sessionId, account.id, account.nickname);
        try {
          await this.broadcastRoomState(roomId, account.id);
        } catch {
          /* phòng có thể vừa giải tán */
        }
      }
    }

    const latestRoom = await this.repository.findRoomById(roomId);
    if (!latestRoom) {
      throw new NotFoundException('Phòng không còn tồn tại');
    }

    if (latestRoom.status === CoCultivationRoomStatus.ACTIVE) {
      await this.repository.updateMember(roomId, account.id, {
        isParticipating: true,
        isReady: true,
      });
      try {
        await this.broadcastRoomState(roomId, account.id);
      } catch {
        /* phòng có thể vừa giải tán */
      }
    }

    return this.buildRoomView(roomId, account.id);
  }

  async quickJoin(deviceId: string): Promise<CoCultivationRoomView> {
    const room = await this.repository.findQuickJoinRoom();
    if (!room) {
      throw new NotFoundException('Hiện chưa có phòng song tu nào');
    }
    return this.joinRoom(deviceId, room.id);
  }

  async leaveRoom(deviceId: string, roomId: string): Promise<{ dissolved: boolean }> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);
    const member = await this.repository.findMember(roomId, account.id);
    if (!member) {
      return { dissolved: false };
    }

    this.pendingOwnHits.delete(this.pendingKey(roomId, account.id));

    await this.repository.removeMember(roomId, account.id);
    await this.repository.markSessionParticipantLeft(room.sessionId, account.id);

    const remaining = await this.repository.countMembers(roomId);
    if (remaining === 0) {
      await this.dissolveRoom(room);
      return { dissolved: true };
    }

    if (room.hostAccountId === account.id) {
      const members = await this.repository.listMembers(roomId);
      const nextHost = members[0];
      if (nextHost) {
        await this.repository.updateHost(roomId, nextHost.accountId);
        await this.repository.updateMember(roomId, nextHost.accountId, { isReady: true });
      }
    }

    await this.broadcastRoomState(roomId);
    return { dissolved: false };
  }

  async setReady(deviceId: string, roomId: string, ready: boolean): Promise<CoCultivationRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);
    if (room.hostAccountId === account.id) {
      throw new BadRequestException('Chủ phòng luôn sẵn sàng');
    }
    await this.requireMember(roomId, account.id);
    await this.repository.updateMember(roomId, account.id, { isReady: ready });
    return this.broadcastRoomState(roomId, account.id);
  }

  async startPractice(deviceId: string, roomId: string): Promise<CoCultivationRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    await this.requireMember(roomId, account.id);
    const room = await this.requireRoom(roomId);

    if (room.hostAccountId !== account.id) {
      throw new ForbiddenException('Chỉ chủ phòng mới có thể bắt đầu song tu');
    }

    if (room.status === CoCultivationRoomStatus.ACTIVE) {
      return this.buildRoomView(roomId, account.id);
    }

    await this.repository.updateRoomStatus(roomId, CoCultivationRoomStatus.ACTIVE);

    const members = await this.repository.listMembers(roomId);
    for (const member of members) {
      await this.repository.updateMember(roomId, member.accountId, {
        isParticipating: true,
      });
    }

    return this.broadcastRoomState(roomId, account.id);
  }

  async joinPractice(deviceId: string, roomId: string): Promise<CoCultivationRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);
    if (room.status !== CoCultivationRoomStatus.ACTIVE) {
      throw new BadRequestException('Phòng chưa bắt đầu song tu');
    }
    await this.requireMember(roomId, account.id);
    await this.repository.updateMember(roomId, account.id, {
      isParticipating: true,
      isReady: true,
    });
    return this.broadcastRoomState(roomId, account.id);
  }

  async kickMember(
    deviceId: string,
    roomId: string,
    targetAccountId: string,
  ): Promise<CoCultivationRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);
    if (room.hostAccountId !== account.id) {
      throw new ForbiddenException('Chỉ chủ phòng mới được đuổi thành viên');
    }
    if (targetAccountId === account.id) {
      throw new BadRequestException('Không thể tự đuổi chính mình');
    }

    const targetMember = await this.repository.findMember(roomId, targetAccountId);
    if (!targetMember) {
      throw new NotFoundException('Thành viên không còn trong phòng');
    }

    this.pendingOwnHits.delete(this.pendingKey(roomId, targetAccountId));
    await this.repository.removeMember(roomId, targetAccountId);
    await this.repository.markSessionParticipantLeft(room.sessionId, targetAccountId);

    const remaining = await this.repository.countMembers(roomId);
    if (remaining === 0) {
      await this.dissolveRoom(room);
      throw new NotFoundException('Phòng đã giải tán');
    }

    return this.broadcastRoomState(roomId, account.id);
  }

  async registerMokHit(
    deviceId: string,
    roomId: string,
  ): Promise<{ meritPoints: string; teamMeritHits: string }> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);
    const member = await this.requireMember(roomId, account.id);

    if (room.status !== CoCultivationRoomStatus.ACTIVE) {
      throw new BadRequestException('Phòng chưa bắt đầu song tu');
    }

    const key = this.pendingKey(roomId, account.id);
    const pending = (this.pendingOwnHits.get(key) ?? 0) + 1;
    this.pendingOwnHits.set(key, pending);

    this.mokBuffer.recordHit(roomId, account.id);
    this.meritPopListener?.(roomId, account.id, 1);

    const base = BigInt(await this.meritLedgerService.getBalance(account.id));
    const meritPoints = (base + BigInt(pending)).toString();

    const teamMeritHits = await this.getTeamMeritHitsDisplay(roomId);
    this.teamMeritListener?.(roomId, teamMeritHits);

    return { meritPoints, teamMeritHits };
  }

  async getRoomViewForDevice(deviceId: string, roomId: string): Promise<CoCultivationRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    await this.requireMember(roomId, account.id);
    return this.buildRoomView(roomId, account.id);
  }

  private async flushBlock(roomId: string, hitsByAccount: Map<string, number>): Promise<void> {
    const room = await this.repository.findRoomById(roomId);
    if (!room) {
      this.mokBuffer.clearRoom(roomId);
      return;
    }

    const accountIds = [...hitsByAccount.keys()];
    if (accountIds.length === 0) {
      return;
    }

    const bonusByAccount = new Map<string, bigint>();
    for (const accountId of accountIds) {
      bonusByAccount.set(accountId, 0n);
    }

    for (const [ hitterId, hits ] of hitsByAccount) {
      const own = BigInt(hits);
      if (own <= 0n) {
        continue;
      }
      const bonusShare = BigInt(Math.floor(Number(own) * SONG_TU_BONUS_RATE));
      for (const recipientId of accountIds) {
        if (recipientId === hitterId) {
          continue;
        }
        bonusByAccount.set(recipientId, (bonusByAccount.get(recipientId) ?? 0n) + bonusShare);
      }
    }

    for (const [accountId, hits] of hitsByAccount) {
      const own = BigInt(hits);
      if (own <= 0n) {
        continue;
      }

      await this.incenseService.creditPendingMerit(accountId);
      await this.meritLedgerService.postCredit(
        accountId,
        own,
        MeritLedgerEntryType.SONG_TU_HIT,
        room.sessionId,
      );
      await this.repository.incrementMemberHits(roomId, accountId, own);
      await this.repository.incrementSessionParticipantStats(room.sessionId, accountId, own, 0n);

      const key = this.pendingKey(roomId, accountId);
      const pending = this.pendingOwnHits.get(key) ?? 0;
      this.pendingOwnHits.set(key, Math.max(0, pending - hits));
    }

    for (const [accountId, bonus] of bonusByAccount) {
      if (bonus <= 0n) {
        continue;
      }
      await this.meritLedgerService.postCredit(
        accountId,
        bonus,
        MeritLedgerEntryType.SONG_TU_BONUS,
        room.sessionId,
      );
      await this.repository.incrementSessionParticipantStats(room.sessionId, accountId, 0n, bonus);
    }

    const teamMeritHits = await this.getTeamMeritHitsDisplay(roomId);
    this.teamMeritListener?.(roomId, teamMeritHits);
  }

  private async dissolveRoom(room: { id: string; sessionId: string }): Promise<void> {
    this.mokBuffer.clearRoom(room.id);
    await this.repository.closeSession(room.sessionId);
    await this.repository.deleteRoom(room.id);
  }

  private async broadcastRoomState(
    roomId: string,
    forAccountId?: string,
  ): Promise<CoCultivationRoomView> {
    const members = await this.repository.listMembers(roomId);
    if (members.length === 0) {
      const room = await this.repository.findRoomById(roomId);
      if (room) {
        await this.dissolveRoom(room);
      }
      throw new NotFoundException('Phòng đã giải tán');
    }

    this.roomStateListener?.(roomId);
    return this.buildRoomView(roomId, forAccountId ?? members[0]!.accountId);
  }

  private async buildRoomView(roomId: string, viewerAccountId: string): Promise<CoCultivationRoomView> {
    const room = await this.requireRoom(roomId);
    const members = await this.repository.listMembers(roomId);
    const accounts = await Promise.all(
      members.map((m) => this.accountRepository.findById(m.accountId)),
    );

    const teamMeritHits = await this.getTeamMeritHitsDisplay(roomId, members);
    const viewerBalance = await this.meritLedgerService.getBalance(viewerAccountId);
    const pending = this.pendingOwnHits.get(this.pendingKey(roomId, viewerAccountId)) ?? 0;

    return {
      id: room.id,
      roomCode: room.roomCode,
      name: room.name,
      hasPassword: Boolean(room.passwordHash),
      status: room.status,
      hostAccountId: room.hostAccountId,
      teamMeritHits,
      myAccountId: viewerAccountId,
      myMeritPoints: (BigInt(viewerBalance) + BigInt(pending)).toString(),
      members: members.map((member, index) => {
        const isHost = member.accountId === room.hostAccountId;
        return {
          accountId: member.accountId,
          nickname: accounts[index]?.nickname ?? '…',
          isHost,
          isReady: isHost ? true : member.isReady,
          isParticipating: member.isParticipating,
          personalMeritHits: member.personalMeritHits,
        };
      }),
    };
  }

  private async getTeamMeritHitsDisplay(
    roomId: string,
    members?: Awaited<ReturnType<CoCultivationRepository['listMembers']>>,
  ): Promise<string> {
    const list = members ?? (await this.repository.listMembers(roomId));
    const persisted = list.reduce((sum, m) => sum + BigInt(m.personalMeritHits), 0n);
    const pending = BigInt(this.mokBuffer.getPendingHitsSum(roomId));
    return (persisted + pending).toString();
  }

  private async ensureSessionParticipant(
    sessionId: string,
    accountId: string,
    nickname: string,
  ): Promise<void> {
    const existing = await this.repository.findOpenSessionParticipant(sessionId, accountId);
    if (!existing) {
      await this.repository.addSessionParticipant({ sessionId, accountId, nickname });
    }
  }

  private async requireRoom(roomId: string) {
    const room = await this.repository.findRoomById(roomId);
    if (!room) {
      throw new NotFoundException('Phòng không tồn tại');
    }
    return room;
  }

  private async requireMember(roomId: string, accountId: string) {
    const member = await this.repository.findMember(roomId, accountId);
    if (!member) {
      throw new ForbiddenException('Bạn chưa ở trong phòng này');
    }
    return member;
  }

  private async verifyPassword(stored: string | null, password?: string): Promise<void> {
    if (!stored) {
      return;
    }
    if (!password || !verifyRoomPassword(password, stored)) {
      throw new ForbiddenException('Mật khẩu phòng không đúng');
    }
  }

  private pendingKey(roomId: string, accountId: string): string {
    return `${roomId}:${accountId}`;
  }

  private async generateUniqueRoomCode(): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = generateTransactionCode(6);
      const existing = await this.repository.findRoomByCode(code);
      if (!existing) {
        return code;
      }
    }
    throw new BadRequestException('Không tạo được mã phòng, thử lại');
  }
}
