import { PkMode } from './entities/pk-mode.enum';
import { PkRoomStatus } from './entities/pk-room-status.enum';
import { PkTeam } from './entities/pk-team.enum';

export interface PkRoomListItem {
  id: string;
  roomCode: string;
  name: string;
  hasPassword: boolean;
  status: PkRoomStatus;
  mode: PkMode;
  teamSize: number;
  memberCount: number;
  createdAt: string;
}

export interface PkMemberView {
  accountId: string;
  nickname: string;
  isHost: boolean;
  team: PkTeam | null;
  isSpectator: boolean;
  isFighter: boolean;
  isReady: boolean;
  matchMeritHits: string;
}

export interface PkRoomView {
  id: string;
  roomCode: string;
  name: string;
  hasPassword: boolean;
  status: PkRoomStatus;
  hostAccountId: string;
  mode: PkMode;
  teamSize: number;
  stakeAmount: string | null;
  durationMinutes: number;
  matchStartedAt: string | null;
  matchEndsAt: string | null;
  redTeamMerit: string;
  blueTeamMerit: string;
  myAccountId: string;
  myMeritPoints: string;
  members: PkMemberView[];
}

export interface PkMatchEndedParticipant {
  rank: number;
  accountId: string;
  nickname: string;
  team: PkTeam | null;
  matchMeritHits: string;
  settlementDelta: string;
}

export interface PkMatchEndedPayload {
  winnerTeam: PkTeam | null;
  redTeamMerit: string;
  blueTeamMerit: string;
  mode: PkMode;
  participants: PkMatchEndedParticipant[];
}
