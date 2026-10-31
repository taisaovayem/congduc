import { Injectable } from '@nestjs/common';

@Injectable()
export class CoCultivationPresenceService {
  private readonly intentionalLeave = new Set<string>();

  markIntentionalLeave(socketId: string): void {
    this.intentionalLeave.add(socketId);
  }

  consumeIntentionalLeave(socketId: string): boolean {
    if (!this.intentionalLeave.has(socketId)) {
      return false;
    }
    this.intentionalLeave.delete(socketId);
    return true;
  }
}
