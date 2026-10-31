import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { SONG_TU_BLOCK_MS } from './co-cultivation.constants';

export interface SongTuBlockFlushPayload {
  roomId: string;
  hitsByAccount: Map<string, number>;
}

type FlushHandler = (payload: SongTuBlockFlushPayload) => Promise<void>;

interface RoomBlockState {
  hitsByAccount: Map<string, number>;
  timer: ReturnType<typeof setTimeout> | null;
}

@Injectable()
export class CoCultivationMokBufferService implements OnModuleDestroy {
  private readonly rooms = new Map<string, RoomBlockState>();
  private flushHandler: FlushHandler | null = null;

  onModuleDestroy(): void {
    for (const state of this.rooms.values()) {
      if (state.timer) {
        clearTimeout(state.timer);
      }
    }
    this.rooms.clear();
  }

  setFlushHandler(handler: FlushHandler): void {
    this.flushHandler = handler;
  }

  recordHit(roomId: string, accountId: string): void {
    const state = this.getOrCreateRoom(roomId);
    const current = state.hitsByAccount.get(accountId) ?? 0;
    state.hitsByAccount.set(accountId, current + 1);
    this.scheduleFlush(roomId, state);
  }

  getPendingHitsSum(roomId: string): number {
    const state = this.rooms.get(roomId);
    if (!state) {
      return 0;
    }
    let sum = 0;
    for (const hits of state.hitsByAccount.values()) {
      sum += hits;
    }
    return sum;
  }

  clearRoom(roomId: string): void {
    const state = this.rooms.get(roomId);
    if (state?.timer) {
      clearTimeout(state.timer);
    }
    this.rooms.delete(roomId);
  }

  private getOrCreateRoom(roomId: string): RoomBlockState {
    let state = this.rooms.get(roomId);
    if (!state) {
      state = { hitsByAccount: new Map(), timer: null };
      this.rooms.set(roomId, state);
    }
    return state;
  }

  private scheduleFlush(roomId: string, state: RoomBlockState): void {
    if (state.timer) {
      return;
    }
    state.timer = setTimeout(() => {
      void this.flushRoom(roomId);
    }, SONG_TU_BLOCK_MS);
  }

  private async flushRoom(roomId: string): Promise<void> {
    const state = this.rooms.get(roomId);
    if (!state) {
      return;
    }

    state.timer = null;
    const hitsByAccount = new Map(state.hitsByAccount);
    state.hitsByAccount.clear();

    if (hitsByAccount.size === 0) {
      return;
    }

    if (this.flushHandler) {
      await this.flushHandler({ roomId, hitsByAccount });
    }
  }
}
