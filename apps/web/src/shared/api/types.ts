export interface AccountProfile {
  id: string;
  deviceId: string;
  nickname: string;
  meritPoints: string;
}

export interface SessionResponse {
  deviceId: string;
  account: AccountProfile;
}

export interface ActiveIncense {
  id: string;
  startedAt: string;
  endsAt: string;
  remainingSeconds: number;
}

/** Trạng thái nhang đẩy qua socket (server tính thời gian còn lại). */
export interface IncenseRealtimeState {
  active: boolean;
  remainingSeconds: number;
  meritPoints: string;
  startedAt?: string;
  endsAt?: string;
}

export interface CreateTransferResponse {
  transferId: string;
  transactionCode: string;
  confirmationCode: string;
  amount: string;
}

export interface ConfirmTransferResponse {
  status: 'pending' | 'completed' | 'cancelled';
  meritPoints: string;
}

export interface JoinReceiveTransferResponse {
  transferId: string;
  amount: string;
}

export type CoCultivationRoomStatus = 'waiting' | 'active';

export interface CoCultivationRoomListItem {
  id: string;
  roomCode: string;
  name: string;
  hasPassword: boolean;
  status: CoCultivationRoomStatus;
  memberCount: number;
  createdAt: string;
}

export interface CoCultivationMemberView {
  accountId: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  isParticipating: boolean;
  personalMeritHits: string;
}

export interface CoCultivationRoomView {
  id: string;
  roomCode: string;
  name: string;
  hasPassword: boolean;
  status: CoCultivationRoomStatus;
  hostAccountId: string;
  teamMeritHits: string;
  members: CoCultivationMemberView[];
  myAccountId: string;
  myMeritPoints: string;
}

export type PkRoomStatus = 'waiting' | 'active';
export type PkTeam = 'red' | 'blue';
export type PkMode = 'friendly' | 'winner_takes_all' | 'fixed_stake';

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

export interface TransferStatusResponse {
  status: 'pending' | 'completed' | 'cancelled';
  amount: string;
  senderConfirmed: boolean;
  receiverConfirmed: boolean;
}
