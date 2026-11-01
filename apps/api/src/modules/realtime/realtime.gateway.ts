import { Logger, OnModuleDestroy, OnModuleInit, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AccountRepository } from '../account/repositories/account.repository';
import { IncenseService } from '../incense/incense.service';
import { MokService } from '../mok/mok.service';
import { IncenseRealtimePayload } from './realtime.types';
import { WsDeviceIdGuard } from './ws-device-id.guard';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly mokService: MokService,
    private readonly incenseService: IncenseService,
    private readonly accountRepository: AccountRepository,
    private readonly wsDeviceIdGuard: WsDeviceIdGuard,
  ) {}

  onModuleInit(): void {
    this.incenseService.setMeritCreditListener((accountId, amount) => {
      void this.notifyIncenseMeritCredit(accountId, amount);
    });
  }

  onModuleDestroy(): void {
    this.incenseService.setMeritCreditListener(null);
  }

  private async notifyIncenseMeritCredit(accountId: string, amount: number): Promise<void> {
    if (amount <= 0) {
      return;
    }
    try {
      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        return;
      }
      await this.pushIncenseState(account.deviceId, amount);
    } catch (err) {
      this.logger.warn(
        `Incense merit credit push failed for ${accountId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const deviceId = this.wsDeviceIdGuard.resolveDeviceId(client);
      if (!deviceId) {
        client.disconnect(true);
        return;
      }
      client.data.deviceId = deviceId;
      await client.join(this.deviceRoom(deviceId));
      await this.pushIncenseState(deviceId);
    } catch (err) {
      this.logger.warn(`WS connect failed: ${err instanceof Error ? err.message : err}`);
      client.disconnect(true);
    }
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('mok:hit')
  async handleMokHit(
    @ConnectedSocket() client: Socket,
    @MessageBody() _payload: Record<string, never>,
  ) {
    const deviceId = client.data.deviceId as string;
    const result = await this.mokService.registerHit(deviceId);
    const event = { meritPoints: result.meritPoints, deviceId };
    client.emit('mok:hit:ack', event);
    this.server.emit('mok:hit:broadcast', event);
    return event;
  }

  emitToDevice(deviceId: string, event: string, payload: unknown): void {
    this.server.to(this.deviceRoom(deviceId)).emit(event, payload);
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('incense:sync')
  async handleIncenseSync(@ConnectedSocket() client: Socket) {
    const deviceId = client.data.deviceId as string;
    return this.pushIncenseState(deviceId);
  }

  async pushIncenseState(
    deviceId: string,
    meritCredited?: number,
  ): Promise<IncenseRealtimePayload | null> {
    const account = await this.accountRepository.findByDeviceId(deviceId);
    if (!account) {
      return null;
    }
    const payload = await this.incenseService.getRealtimeState(account.id);
    if (meritCredited !== undefined && meritCredited > 0) {
      payload.meritCredited = meritCredited;
    }
    this.emitToDevice(deviceId, 'incense:update', payload);
    return payload;
  }

  private deviceRoom(deviceId: string): string {
    return `device:${deviceId}`;
  }
}
