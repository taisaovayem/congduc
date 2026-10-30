export interface AccountProfile {
  id: string;
  deviceId: string;
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

export interface TransferStatusResponse {
  status: 'pending' | 'completed' | 'cancelled';
  amount: string;
  senderConfirmed: boolean;
  receiverConfirmed: boolean;
}
