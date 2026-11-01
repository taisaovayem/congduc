import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { generateTransactionCode } from '../../common/utils/code.util';
import { isPkRoomMissingError } from '../../common/utils/pg-error.util';
import { AccountService } from '../account/account.service';
import { AccountRepository } from '../account/repositories/account.repository';
import { MeritLedgerEntryType } from '../merit-ledger/entities/merit-ledger-entry-type.enum';
import { MeritLedgerService } from '../merit-ledger/merit-ledger.service';
import { hashRoomPassword, verifyRoomPassword } from '../co-cultivation/utils/room-password.util';
import { PK_START_COUNTDOWN_MS, PK_TEAM_BONUS_RATE, pickRandomPkRoomName } from './pk.constants';
import { PkMokBufferService } from './pk-mok-buffer.service';
import { PkMatchEndedPayload, PkRoomListItem, PkRoomView } from './pk.types';
import { PkMode } from './entities/pk-mode.enum';
import { PkRoomStatus } from './entities/pk-room-status.enum';
import { PkTeam } from './entities/pk-team.enum';
import { PkRepository } from './repositories/pk.repository';
import { PkRoomMemberEntity } from './entities/pk-room-member.entity';

export type PkRoomStateListener = (roomId: string) => void;
export type PkMeritPopListener = (roomId: string, accountId: string, amount: number) => void;
export type PkTeamMeritListener = (
  roomId: string,
  redTeamMerit: string,
  blueTeamMerit: string,
) => void;
export type PkMatchEndedListener = (roomId: string, payload: PkMatchEndedPayload) => void;

@Injectable()
export class PkService implements OnModuleInit {
  private roomStateListener: PkRoomStateListener | null = null;
  private meritPopListener: PkMeritPopListener | null = null;
  private teamMeritListener: PkTeamMeritListener | null = null;
  private matchEndedListener: PkMatchEndedListener | null = null;
  private readonly matchTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly repository: PkRepository,
    private readonly accountService: AccountService,
    private readonly accountRepository: AccountRepository,
    private readonly meritLedgerService: MeritLedgerService,
    private readonly mokBuffer: PkMokBufferService,
  ) {}

  onModuleInit(): void {
    this.mokBuffer.setFlushHandler((payload) => this.flushBlock(payload.roomId, payload.hitsByAccount));
    void this.rescheduleActiveMatches();
  }

  setRoomStateListener(listener: PkRoomStateListener | null): void {
    this.roomStateListener = listener;
  }

  setMeritPopListener(listener: PkMeritPopListener | null): void {
    this.meritPopListener = listener;
  }

  setTeamMeritListener(listener: PkTeamMeritListener | null): void {
    this.teamMeritListener = listener;
  }

  setMatchEndedListener(listener: PkMatchEndedListener | null): void {
    this.matchEndedListener = listener;
  }

  async listRooms(): Promise<PkRoomListItem[]> {
    const rows = await this.repository.listActiveRooms();
    return rows.map((row) => ({
      id: row.id,
      roomCode: row.roomCode,
      name: row.name,
      hasPassword: row.hasPassword,
      status: row.status,
      mode: row.mode,
      teamSize: row.teamSize,
      memberCount: row.memberCount,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createRoom(
    deviceId: string,
    input: {
      name?: string;
      password?: string;
      teamSize?: number;
      mode?: PkMode;
      stakeAmount?: string;
      durationMinutes?: number;
    },
  ): Promise<PkRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const roomCode = await this.generateUniqueRoomCode();
    const name = input.name?.trim() || pickRandomPkRoomName();
    const password = input.password?.trim();
    const passwordHash = password ? hashRoomPassword(password) : null;
    const teamSize = input.teamSize ?? 1;
    const mode = input.mode ?? PkMode.FRIENDLY;
    const durationMinutes = input.durationMinutes ?? 1;

    let stakeAmount: string | null = null;
    if (mode === PkMode.FIXED_STAKE) {
      const raw = input.stakeAmount?.trim() ?? '0';
      if (!/^\d+$/.test(raw) || BigInt(raw) <= 0n) {
        throw new BadRequestException('Số công đức cược phải là số nguyên dương');
      }
      stakeAmount = raw;
    }

    const room = await this.repository.createRoom({
      roomCode,
      name,
      passwordHash,
      hostAccountId: account.id,
      teamSize,
      mode,
      stakeAmount,
      durationMinutes,
    });

    await this.repository.addMember({
      roomId: room.id,
      accountId: account.id,
      team: PkTeam.RED,
      isSpectator: false,
      isReady: true,
    });

    return this.buildRoomView(room.id, account.id);
  }

  async joinRoomByCode(
    deviceId: string,
    roomCode: string,
    password?: string,
  ): Promise<PkRoomView> {
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
  ): Promise<PkRoomView> {
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
      if (roomStillOpen.status === PkRoomStatus.ACTIVE) {
        try {
          await this.repository.addMember({
            roomId,
            accountId: account.id,
            team: null,
            isSpectator: true,
          });
          joinedNow = true;
        } catch (error) {
          joinedNow = await this.recoverPkJoinRace(roomId, account.id, error);
        }
      } else {
        const team = await this.pickTeamForNewFighter(roomId, roomStillOpen.teamSize);
        if (!team) {
          throw new BadRequestException('Phòng đã đủ người thi đấu');
        }
        try {
          await this.repository.addMember({
            roomId,
            accountId: account.id,
            team,
            isSpectator: false,
          });
          joinedNow = true;
        } catch (error) {
          joinedNow = await this.recoverPkJoinRace(roomId, account.id, error);
        }
      }

      if (joinedNow) {
        try {
          await this.broadcastRoomState(roomId, account.id);
        } catch {
          /* phòng có thể vừa giải tán */
        }
      }
    }

    return this.buildRoomView(roomId, account.id);
  }

  async quickJoin(deviceId: string): Promise<PkRoomView> {
    const room = await this.repository.findQuickJoinRoom();
    if (!room) {
      throw new NotFoundException('Hiện chưa có phòng PK nào');
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

    if (room.status === PkRoomStatus.ACTIVE && member.isFighter) {
      throw new BadRequestException('Đang PK — bạn có thể rời màn hình và tham gia lại sau');
    }

    if (
      room.status === PkRoomStatus.WAITING &&
      member.isReady &&
      room.hostAccountId !== account.id &&
      !member.isSpectator
    ) {
      throw new BadRequestException('Bạn cần bỏ sẵn sàng trước khi rời phòng');
    }

    await this.repository.removeMember(roomId, account.id);

    const remaining = await this.repository.countMembers(roomId);
    if (remaining === 0) {
      this.clearMatchTimer(roomId);
      this.mokBuffer.clearRoom(roomId);
      await this.repository.deleteRoom(roomId);
      return { dissolved: true };
    }

    if (room.hostAccountId === account.id) {
      const members = await this.repository.listMembers(roomId);
      const nextHost = members[0];
      if (nextHost) {
        await this.repository.updateRoom(roomId, { hostAccountId: nextHost.accountId });
        await this.repository.updateMember(roomId, nextHost.accountId, { isReady: true });
      }
    }

    await this.broadcastRoomState(roomId);
    return { dissolved: false };
  }

  async setReady(deviceId: string, roomId: string, ready: boolean): Promise<PkRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);
    if (room.status !== PkRoomStatus.WAITING) {
      throw new BadRequestException('Chỉ đặt sẵn sàng khi phòng đang chờ');
    }
    if (room.hostAccountId === account.id) {
      throw new BadRequestException('Chủ phòng luôn sẵn sàng');
    }
    const member = await this.requireFighterMember(roomId, account.id);
    await this.repository.updateMember(roomId, account.id, { isReady: ready });
    return this.broadcastRoomState(roomId, account.id);
  }

  async switchTeam(deviceId: string, roomId: string): Promise<PkRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);
    if (room.status !== PkRoomStatus.WAITING) {
      throw new BadRequestException('Chỉ đổi phe khi phòng đang chờ');
    }
    const member = await this.requireFighterMember(roomId, account.id);
    if (!member.team) {
      throw new BadRequestException('Khán giả không thể đổi phe');
    }
    const targetTeam = member.team === PkTeam.RED ? PkTeam.BLUE : PkTeam.RED;
    const targetCount = await this.repository.countFightersByTeam(roomId, targetTeam);
    if (targetCount >= room.teamSize) {
      throw new BadRequestException('Phe kia đã đủ người');
    }
    await this.repository.updateMember(roomId, account.id, { team: targetTeam, isReady: false });
    return this.broadcastRoomState(roomId, account.id);
  }

  async kickMember(
    deviceId: string,
    roomId: string,
    targetAccountId: string,
  ): Promise<PkRoomView> {
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

    if (room.status === PkRoomStatus.ACTIVE && targetMember.isFighter && !targetMember.isSpectator) {
      throw new BadRequestException('Không thể đuổi võ sĩ đang thi đấu');
    }

    await this.repository.removeMember(roomId, targetAccountId);

    const remaining = await this.repository.countMembers(roomId);
    if (remaining === 0) {
      this.clearMatchTimer(roomId);
      this.mokBuffer.clearRoom(roomId);
      await this.repository.deleteRoom(roomId);
      throw new NotFoundException('Phòng đã giải tán');
    }

    return this.broadcastRoomState(roomId, account.id);
  }

  async startMatch(deviceId: string, roomId: string): Promise<PkRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    await this.requireMember(roomId, account.id);
    const room = await this.requireRoom(roomId);

    if (room.hostAccountId !== account.id) {
      throw new ForbiddenException('Chỉ chủ phòng mới có thể bắt đầu PK');
    }
    if (room.status === PkRoomStatus.ACTIVE) {
      return this.buildRoomView(roomId, account.id);
    }

    const fighters = await this.listFighters(roomId);
    const red = fighters.filter((m) => m.team === PkTeam.RED);
    const blue = fighters.filter((m) => m.team === PkTeam.BLUE);
    if (red.length === 0 || red.length !== blue.length) {
      throw new BadRequestException('Hai phe phải có số người bằng nhau');
    }
    for (const fighter of fighters) {
      const isHost = fighter.accountId === room.hostAccountId;
      if (!isHost && !fighter.isReady) {
        throw new BadRequestException('Tất cả thành viên phải sẵn sàng trước khi bắt đầu');
      }
    }

    const startedAt = new Date(Date.now() + PK_START_COUNTDOWN_MS);
    const endsAt = new Date(startedAt.getTime() + room.durationMinutes * 60_000);

    await this.repository.updateRoom(roomId, {
      status: PkRoomStatus.ACTIVE,
      matchStartedAt: startedAt,
      matchEndsAt: endsAt,
    });

    for (const fighter of fighters) {
      await this.repository.updateMember(roomId, fighter.accountId, {
        isFighter: true,
        isSpectator: false,
      });
    }

    this.scheduleMatchEnd(roomId, endsAt);
    return this.broadcastRoomState(roomId, account.id);
  }

  async registerMokHit(
    deviceId: string,
    roomId: string,
  ): Promise<{ redTeamMerit: string; blueTeamMerit: string }> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const room = await this.requireRoom(roomId);
    const member = await this.requireMember(roomId, account.id);

    if (room.status !== PkRoomStatus.ACTIVE) {
      throw new BadRequestException('Trận PK chưa bắt đầu');
    }
    if (!this.isMatchFightStarted(room)) {
      throw new BadRequestException('Đang đếm ngược — chưa gõ được mõ');
    }
    if (!member.isFighter || member.isSpectator) {
      throw new ForbiddenException('Chỉ võ sĩ mới gõ được mõ');
    }

    this.mokBuffer.recordHit(roomId, account.id);
    this.meritPopListener?.(roomId, account.id, 1);

    const { red, blue } = await this.getTeamMeritDisplay(roomId);
    this.teamMeritListener?.(roomId, red, blue);
    return { redTeamMerit: red, blueTeamMerit: blue };
  }

  async getRoomViewForDevice(deviceId: string, roomId: string): Promise<PkRoomView> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    await this.requireMember(roomId, account.id);
    return this.buildRoomView(roomId, account.id);
  }

  private async flushBlock(roomId: string, hitsByAccount: Map<string, number>): Promise<void> {
    const room = await this.repository.findRoomById(roomId);
    if (!room || room.status !== PkRoomStatus.ACTIVE || !this.isMatchFightStarted(room)) {
      this.mokBuffer.clearRoom(roomId);
      return;
    }

    const members = await this.repository.listMembers(roomId);
    const memberById = new Map(members.map((m) => [m.accountId, m]));
    const teamByAccount = new Map(members.map((m) => [m.accountId, m.team]));

    const bonusByAccount = new Map<string, bigint>();
    for (const accountId of hitsByAccount.keys()) {
      bonusByAccount.set(accountId, 0n);
    }

    for (const [hitterId, hits] of hitsByAccount) {
      const hitter = memberById.get(hitterId);
      if (!hitter?.team || !hitter.isFighter) {
        continue;
      }
      const own = BigInt(hits);
      const bonusShare = BigInt(Math.floor(Number(own) * PK_TEAM_BONUS_RATE));
      if (bonusShare <= 0n) {
        continue;
      }
      for (const teammate of members) {
        if (teammate.team !== hitter.team || teammate.accountId === hitterId || !teammate.isFighter) {
          continue;
        }
        bonusByAccount.set(
          teammate.accountId,
          (bonusByAccount.get(teammate.accountId) ?? 0n) + bonusShare,
        );
      }
    }

    for (const [accountId, hits] of hitsByAccount) {
      const member = memberById.get(accountId);
      if (!member?.isFighter) {
        continue;
      }
      const own = BigInt(hits);
      if (own <= 0n) {
        continue;
      }
      await this.repository.incrementMatchMerit(roomId, accountId, own);
    }

    for (const [accountId, bonus] of bonusByAccount) {
      if (bonus <= 0n) {
        continue;
      }
      await this.repository.incrementMatchMerit(roomId, accountId, bonus);
      const bonusAmount = Number(bonus);
      if (bonusAmount > 0) {
        this.meritPopListener?.(roomId, accountId, bonusAmount);
      }
    }

    const { red, blue } = await this.getTeamMeritDisplay(roomId);
    this.teamMeritListener?.(roomId, red, blue);
  }

  private async endMatch(roomId: string): Promise<void> {
    const room = await this.repository.findRoomById(roomId);
    if (!room || room.status !== PkRoomStatus.ACTIVE) {
      return;
    }

    this.clearMatchTimer(roomId);
    await this.mokBuffer.flushNow(roomId);

    const members = await this.repository.listMembers(roomId);
    const fighters = members.filter((m) => m.isFighter && m.team);
    const redTotal = this.sumTeamMerit(fighters, PkTeam.RED);
    const blueTotal = this.sumTeamMerit(fighters, PkTeam.BLUE);

    let winnerTeam: PkTeam | null = null;
    if (redTotal > blueTotal) {
      winnerTeam = PkTeam.RED;
    } else if (blueTotal > redTotal) {
      winnerTeam = PkTeam.BLUE;
    }

    const settlementDeltas = new Map<string, bigint>();
    if (room.mode !== PkMode.FRIENDLY) {
      if (!winnerTeam) {
        await this.settleDraw(fighters, room.id, settlementDeltas);
      } else {
        await this.settleMatch(room, fighters, winnerTeam, redTotal, blueTotal, settlementDeltas);
      }
    }

    const fighterAccounts = await Promise.all(
      fighters.map((m) => this.accountRepository.findById(m.accountId)),
    );
    const participants = fighters
      .map((fighter, index) => ({
        accountId: fighter.accountId,
        nickname: fighterAccounts[index]?.nickname ?? '…',
        team: fighter.team,
        matchMeritHits: fighter.matchMeritHits,
        settlementDelta: (settlementDeltas.get(fighter.accountId) ?? 0n).toString(),
      }))
      .sort((a, b) => {
        const diff = BigInt(b.matchMeritHits) - BigInt(a.matchMeritHits);
        if (diff > 0n) {
          return 1;
        }
        if (diff < 0n) {
          return -1;
        }
        return a.nickname.localeCompare(b.nickname, 'vi');
      })
      .map((row, index) => ({
        rank: index + 1,
        accountId: row.accountId,
        nickname: row.nickname,
        team: row.team,
        matchMeritHits: row.matchMeritHits,
        settlementDelta: row.settlementDelta,
      }));

    await this.repository.updateRoom(roomId, {
      status: PkRoomStatus.WAITING,
      matchStartedAt: null,
      matchEndsAt: null,
    });
    await this.repository.resetAllMatchMerit(roomId);
    for (const fighter of fighters) {
      await this.repository.updateMember(roomId, fighter.accountId, {
        isFighter: false,
        isReady: fighter.accountId === room.hostAccountId,
      });
    }

    this.matchEndedListener?.(roomId, {
      winnerTeam,
      redTeamMerit: redTotal.toString(),
      blueTeamMerit: blueTotal.toString(),
      mode: room.mode,
      participants,
    });

    try {
      await this.broadcastRoomState(roomId);
    } catch {
      /* phòng có thể vừa giải tán */
    }
  }

  private async settleMatch(
    room: { id: string; mode: PkMode; stakeAmount: string | null },
    fighters: PkRoomMemberEntity[],
    winnerTeam: PkTeam,
    redTotal: bigint,
    blueTotal: bigint,
    settlementDeltas: Map<string, bigint>,
  ): Promise<void> {
    const winners = fighters.filter((m) => m.team === winnerTeam);
    const losers = fighters.filter((m) => m.team !== winnerTeam);
    if (winners.length === 0 || losers.length === 0) {
      return;
    }

    if (room.mode === PkMode.WINNER_TAKES_ALL) {
      const pool = redTotal + blueTotal;
      if (pool <= 0n) {
        return;
      }
      // Đội thua: công đức trong trận chưa lên sổ — coi như chuyển hết cho đội thắng, không trừ thêm sổ.
      await this.creditSplitFloor(
        settlementDeltas,
        winners.map((m) => m.accountId),
        pool,
        room.id,
        MeritLedgerEntryType.PK_SETTLEMENT_WIN,
      );
      return;
    }

    if (room.mode === PkMode.FIXED_STAKE && room.stakeAmount) {
      const stake = BigInt(room.stakeAmount);
      if (stake <= 0n) {
        return;
      }
      await this.creditSplitFloor(
        settlementDeltas,
        winners.map((m) => m.accountId),
        stake,
        room.id,
        MeritLedgerEntryType.PK_SETTLEMENT_WIN,
      );

      await this.settleLosersAfterTeamEarned(
        losers,
        stake,
        room.id,
        settlementDeltas,
      );
    }
  }

  /** Hòa: mỗi võ sĩ nhận đúng công đức đã kiếm trong trận (theo phe). */
  private async settleDraw(
    fighters: PkRoomMemberEntity[],
    roomId: string,
    settlementDeltas: Map<string, bigint>,
  ): Promise<void> {
    for (const fighter of fighters) {
      const earned = BigInt(fighter.matchMeritHits);
      if (earned <= 0n) {
        continue;
      }
      settlementDeltas.set(fighter.accountId, (settlementDeltas.get(fighter.accountId) ?? 0n) + earned);
      await this.meritLedgerService.postCredit(
        fighter.accountId,
        earned,
        MeritLedgerEntryType.PK_SETTLEMENT_WIN,
        roomId,
      );
    }
  }

  /**
   * Đội thua: trừ cược/thua bằng công đức kiếm trong trận trước;
   * phần còn lại (nếu có) chia cho đội; thiếu thì trừ tiếp vào sổ từng thành viên.
   */
  private async settleLosersAfterTeamEarned(
    losers: PkRoomMemberEntity[],
    penalty: bigint,
    roomId: string,
    settlementDeltas: Map<string, bigint>,
  ): Promise<void> {
    const loserIds = losers.map((m) => m.accountId);
    if (loserIds.length === 0 || penalty <= 0n) {
      return;
    }

    const teamEarned = losers.reduce((sum, m) => sum + BigInt(m.matchMeritHits), 0n);
    if (teamEarned >= penalty) {
      const netToTeam = teamEarned - penalty;
      if (netToTeam > 0n) {
        await this.creditSplitFloor(
          settlementDeltas,
          loserIds,
          netToTeam,
          roomId,
          MeritLedgerEntryType.PK_SETTLEMENT_WIN,
        );
      }
      return;
    }

    const shortfall = penalty - teamEarned;
    await this.debitSplitCeil(settlementDeltas, loserIds, shortfall, roomId);
  }

  private async creditSplitFloor(
    settlementDeltas: Map<string, bigint>,
    accountIds: string[],
    total: bigint,
    referenceId: string,
    entryType: MeritLedgerEntryType,
  ): Promise<void> {
    if (accountIds.length === 0 || total <= 0n) {
      return;
    }
    const each = total / BigInt(accountIds.length);
    if (each <= 0n) {
      return;
    }
    for (const accountId of accountIds) {
      settlementDeltas.set(accountId, (settlementDeltas.get(accountId) ?? 0n) + each);
      await this.meritLedgerService.postCredit(accountId, each, entryType, referenceId);
    }
  }

  private async debitSplitCeil(
    settlementDeltas: Map<string, bigint>,
    accountIds: string[],
    total: bigint,
    referenceId: string,
  ): Promise<void> {
    if (accountIds.length === 0 || total <= 0n) {
      return;
    }
    const n = BigInt(accountIds.length);
    const each = (total + n - 1n) / n;
    if (each <= 0n) {
      return;
    }
    for (const accountId of accountIds) {
      settlementDeltas.set(accountId, (settlementDeltas.get(accountId) ?? 0n) - each);
      await this.meritLedgerService.postDebit(
        accountId,
        each,
        MeritLedgerEntryType.PK_SETTLEMENT_LOSS,
        referenceId,
      );
    }
  }

  private async broadcastRoomState(roomId: string, forAccountId?: string): Promise<PkRoomView> {
    const members = await this.repository.listMembers(roomId);
    if (members.length === 0) {
      this.clearMatchTimer(roomId);
      this.mokBuffer.clearRoom(roomId);
      await this.repository.deleteRoom(roomId);
      throw new NotFoundException('Phòng đã giải tán');
    }

    this.roomStateListener?.(roomId);
    return this.buildRoomView(roomId, forAccountId ?? members[0]!.accountId);
  }

  private async buildRoomView(roomId: string, viewerAccountId: string): Promise<PkRoomView> {
    const room = await this.requireRoom(roomId);
    const members = await this.repository.listMembers(roomId);
    const accounts = await Promise.all(
      members.map((m) => this.accountRepository.findById(m.accountId)),
    );
    const teamByAccount = new Map(members.map((m) => [m.accountId, m.team]));
    const { red, blue } = await this.getTeamMeritDisplay(roomId, members, teamByAccount);
    const viewerBalance = await this.meritLedgerService.getBalance(viewerAccountId);

    return {
      id: room.id,
      roomCode: room.roomCode,
      name: room.name,
      hasPassword: Boolean(room.passwordHash),
      status: room.status,
      hostAccountId: room.hostAccountId,
      mode: room.mode,
      teamSize: room.teamSize,
      stakeAmount: room.stakeAmount,
      durationMinutes: room.durationMinutes,
      matchStartedAt: room.matchStartedAt?.toISOString() ?? null,
      matchEndsAt: room.matchEndsAt?.toISOString() ?? null,
      redTeamMerit: red,
      blueTeamMerit: blue,
      myAccountId: viewerAccountId,
      myMeritPoints: viewerBalance,
      members: members.map((member, index) => {
        const isHost = member.accountId === room.hostAccountId;
        return {
          accountId: member.accountId,
          nickname: accounts[index]?.nickname ?? '…',
          isHost,
          team: member.team,
          isSpectator: member.isSpectator,
          isFighter: member.isFighter,
          isReady: isHost ? true : member.isReady,
          matchMeritHits: member.matchMeritHits,
        };
      }),
    };
  }

  private async getTeamMeritDisplay(
    roomId: string,
    members?: PkRoomMemberEntity[],
    teamByAccount?: Map<string, PkTeam | null>,
  ): Promise<{ red: string; blue: string }> {
    const list = members ?? (await this.repository.listMembers(roomId));
    const teams =
      teamByAccount ?? new Map(list.map((m) => [m.accountId, m.team]));
    let red = 0n;
    let blue = 0n;
    for (const member of list) {
      if (!member.isFighter) {
        continue;
      }
      const hits = BigInt(member.matchMeritHits);
      if (member.team === PkTeam.RED) {
        red += hits;
      } else if (member.team === PkTeam.BLUE) {
        blue += hits;
      }
    }
    const pending = this.mokBuffer.getPendingHitsByTeam(
      roomId,
      new Map([...teams.entries()].map(([id, team]) => [id, team])),
    );
    red += BigInt(pending.red);
    blue += BigInt(pending.blue);
    return { red: red.toString(), blue: blue.toString() };
  }

  private sumTeamMerit(fighters: PkRoomMemberEntity[], team: PkTeam): bigint {
    return fighters
      .filter((m) => m.team === team)
      .reduce((sum, m) => sum + BigInt(m.matchMeritHits), 0n);
  }

  private async listFighters(roomId: string): Promise<PkRoomMemberEntity[]> {
    const members = await this.repository.listMembers(roomId);
    return members.filter((m) => !m.isSpectator && m.team);
  }

  private async pickTeamForNewFighter(roomId: string, teamSize: number): Promise<PkTeam | null> {
    const redCount = await this.repository.countFightersByTeam(roomId, PkTeam.RED);
    const blueCount = await this.repository.countFightersByTeam(roomId, PkTeam.BLUE);
    if (redCount >= teamSize && blueCount >= teamSize) {
      return null;
    }
    if (redCount < blueCount) {
      return PkTeam.RED;
    }
    if (blueCount < redCount) {
      return PkTeam.BLUE;
    }
    return PkTeam.BLUE;
  }

  /** HTTP join và socket room:enter có thể chạy song song — coi trùng khóa là đã vào phòng. */
  private async recoverPkJoinRace(
    roomId: string,
    accountId: string,
    error: unknown,
  ): Promise<boolean> {
    const raced = await this.repository.findMember(roomId, accountId);
    if (raced) {
      return false;
    }
    if (isPkRoomMissingError(error)) {
      throw new NotFoundException('Phòng không còn tồn tại');
    }
    throw error;
  }

  private isMatchFightStarted(room: { matchStartedAt: Date | null }): boolean {
    if (!room.matchStartedAt) {
      return false;
    }
    return room.matchStartedAt.getTime() <= Date.now();
  }

  private scheduleMatchEnd(roomId: string, endsAt: Date): void {
    this.clearMatchTimer(roomId);
    const delay = Math.max(0, endsAt.getTime() - Date.now());
    const timer = setTimeout(() => {
      void this.endMatch(roomId);
    }, delay);
    this.matchTimers.set(roomId, timer);
  }

  private clearMatchTimer(roomId: string): void {
    const timer = this.matchTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.matchTimers.delete(roomId);
    }
  }

  private async rescheduleActiveMatches(): Promise<void> {
    const rooms = await this.repository.listActiveRoomsWithMatchEnd();
    const now = Date.now();
    for (const room of rooms) {
      if (!room.matchEndsAt) {
        continue;
      }
      if (room.matchEndsAt.getTime() <= now) {
        await this.endMatch(room.id);
      } else {
        this.scheduleMatchEnd(room.id, room.matchEndsAt);
      }
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

  private async requireFighterMember(roomId: string, accountId: string) {
    const member = await this.requireMember(roomId, accountId);
    if (member.isSpectator || !member.team) {
      throw new BadRequestException('Chỉ võ sĩ mới thực hiện được thao tác này');
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
