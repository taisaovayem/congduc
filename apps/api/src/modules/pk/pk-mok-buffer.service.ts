import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PK_BLOCK_MS } from './pk.constants';

export interface PkBlockFlushPayload {
  roomId: string;
  hitsByAccount: Map<string, number>;
}

type FlushHandler = (payload: PkBlockFlushPayload) => Promise<void>;

interface RoomBlockState {
  hitsByAccount: Map<string, number>;
  timer: ReturnType<typeof setTimeout> | null;
}

@Injectable()
export class PkMokBufferService implements OnModuleDestroy {
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

  getPendingHitsByTeam(
    roomId: string,
    teamByAccount: Map<string, string | null>,
  ): { red: number; blue: number } {
    const state = this.rooms.get(roomId);
    if (!state) {
      return { red: 0, blue: 0 };
    }
    let red = 0;
    let blue = 0;
    for (const [accountId, hits] of state.hitsByAccount) {
      const team = teamByAccount.get(accountId);
      if (team === 'red') {
        red += hits;
      } else if (team === 'blue') {
        blue += hits;
      }
    }
    return { red, blue };
  }

  clearRoom(roomId: string): void {
    const state = this.rooms.get(roomId);
    if (state?.timer) {
      clearTimeout(state.timer);
    }
    this.rooms.delete(roomId);
  }

  async flushNow(roomId: string): Promise<void> {
    const state = this.rooms.get(roomId);
    if (!state) {
      return;
    }
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
    await this.flushRoom(roomId);
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
    }, PK_BLOCK_MS);
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
