import { CoCultivationRoomStatus } from './entities/co-cultivation-room-status.enum';

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

export interface CoCultivationRoomListItem {
  id: string;
  roomCode: string;
  name: string;
  hasPassword: boolean;
  status: CoCultivationRoomStatus;
  memberCount: number;
  createdAt: string;
}
