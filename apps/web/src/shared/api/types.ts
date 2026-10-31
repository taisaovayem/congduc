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

export interface TransferStatusResponse {
  status: 'pending' | 'completed' | 'cancelled';
  amount: string;
  senderConfirmed: boolean;
  receiverConfirmed: boolean;
}
