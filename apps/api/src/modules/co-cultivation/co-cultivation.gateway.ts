import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsDeviceIdGuard } from '../realtime/ws-device-id.guard';
import { CoCultivationPresenceService } from './co-cultivation-presence.service';
import { CoCultivationService } from './co-cultivation.service';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/co-cultivation',
})
export class CoCultivationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CoCultivationGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly coCultivationService: CoCultivationService,
    private readonly wsDeviceIdGuard: WsDeviceIdGuard,
    private readonly presenceService: CoCultivationPresenceService,
  ) {
    this.coCultivationService.setRoomStateListener((roomId) => {
      void this.emitRoomStateToAll(roomId);
    });
    this.coCultivationService.setMeritPopListener((roomId, accountId, amount) => {
      this.server.to(this.roomChannel(roomId)).emit('room:merit-pop', { accountId, amount });
    });
    this.coCultivationService.setTeamMeritListener((roomId, teamMeritHits) => {
      this.server.to(this.roomChannel(roomId)).emit('room:team-merit', { teamMeritHits });
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const deviceId = this.wsDeviceIdGuard.resolveDeviceId(client);
      if (!deviceId) {
        client.disconnect(true);
        return;
      }
      client.data.deviceId = deviceId;
    } catch (err) {
      this.logger.warn(`WS connect failed: ${err instanceof Error ? err.message : err}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    if (this.presenceService.consumeIntentionalLeave(client.id)) {
      return;
    }

    const deviceId = client.data.deviceId as string | undefined;
    const roomId = client.data.roomId as string | undefined;
    if (!deviceId || !roomId) {
      return;
    }

    try {
      await this.coCultivationService.leaveRoom(deviceId, roomId);
    } catch (err) {
      this.logger.warn(
        `WS disconnect leave failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:enter')
  async handleRoomEnter(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; password?: string },
  ) {
    const deviceId = client.data.deviceId as string;
    const previousRoomId = client.data.roomId as string | undefined;
    if (previousRoomId && previousRoomId !== payload.roomId) {
      await client.leave(this.roomChannel(previousRoomId));
    }

    const view = await this.coCultivationService.joinRoom(deviceId, payload.roomId, payload.password);
    await client.join(this.roomChannel(payload.roomId));
    client.data.roomId = payload.roomId;
    client.emit('room:state', view);
    return view;
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:sync')
  async handleRoomSync(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const deviceId = client.data.deviceId as string;
    const view = await this.coCultivationService.getRoomViewForDevice(deviceId, payload.roomId);
    client.emit('room:state', view);
    return view;
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:leave')
  async handleRoomLeave(@ConnectedSocket() client: Socket) {
    const deviceId = client.data.deviceId as string;
    const roomId = client.data.roomId as string | undefined;
    if (!roomId) {
      return { dissolved: false };
    }

    this.presenceService.markIntentionalLeave(client.id);
    await client.leave(this.roomChannel(roomId));
    client.data.roomId = undefined;
    return this.coCultivationService.leaveRoom(deviceId, roomId);
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:set-ready')
  async handleSetReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; ready: boolean },
  ) {
    const deviceId = client.data.deviceId as string;
    return this.coCultivationService.setReady(deviceId, payload.roomId, payload.ready);
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:start')
  async handleStart(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }) {
    const deviceId = client.data.deviceId as string;
    return this.coCultivationService.startPractice(deviceId, payload.roomId);
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:join-practice')
  async handleJoinPractice(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const deviceId = client.data.deviceId as string;
    return this.coCultivationService.joinPractice(deviceId, payload.roomId);
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:kick')
  async handleKick(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; targetAccountId: string },
  ) {
    const deviceId = client.data.deviceId as string;
    const view = await this.coCultivationService.kickMember(
      deviceId,
      payload.roomId,
      payload.targetAccountId,
    );
    this.server.to(this.roomChannel(payload.roomId)).emit('room:member-kicked', {
      targetAccountId: payload.targetAccountId,
    });
    return view;
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('mok:hit')
  async handleMokHit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const deviceId = client.data.deviceId as string;
    const result = await this.coCultivationService.registerMokHit(deviceId, payload.roomId);
    client.emit('mok:hit:ack', result);
    return result;
  }

  private roomChannel(roomId: string): string {
    return `room:${roomId}`;
  }

  private async emitRoomStateToAll(roomId: string): Promise<void> {
    const sockets = await this.server.in(this.roomChannel(roomId)).fetchSockets();
    await Promise.all(
      sockets.map(async (remote) => {
        const deviceId = remote.data.deviceId as string | undefined;
        if (!deviceId) {
          return;
        }
        try {
          const view = await this.coCultivationService.getRoomViewForDevice(deviceId, roomId);
          remote.emit('room:state', view);
        } catch {
          /* member may have just left */
        }
      }),
    );
  }
}
