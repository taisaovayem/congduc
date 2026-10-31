import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Logger,
  UseGuards,
} from '@nestjs/common';
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
import { CoCultivationPresenceService } from '../co-cultivation/co-cultivation-presence.service';
import { PkService } from './pk.service';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/pk',
})
export class PkGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PkGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly pkService: PkService,
    private readonly wsDeviceIdGuard: WsDeviceIdGuard,
    private readonly presenceService: CoCultivationPresenceService,
  ) {
    this.pkService.setRoomStateListener((roomId) => {
      void this.emitRoomStateToAll(roomId);
    });
    this.pkService.setMeritPopListener((roomId, accountId, amount) => {
      this.server.to(this.roomChannel(roomId)).emit('room:merit-pop', { accountId, amount });
    });
    this.pkService.setTeamMeritListener((roomId, redTeamMerit, blueTeamMerit) => {
      this.server.to(this.roomChannel(roomId)).emit('room:team-merit', {
        redTeamMerit,
        blueTeamMerit,
      });
    });
    this.pkService.setMatchEndedListener((roomId, payload) => {
      this.server.to(this.roomChannel(roomId)).emit('room:match-ended', payload);
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

  handleDisconnect(_client: Socket): void {
    /* PK: mất kết nối không rời trận — võ sĩ có thể vào lại */
  }

  private actionError(err: unknown): { error: string } {
    return { error: this.extractClientErrorMessage(err) };
  }

  private extractClientErrorMessage(err: unknown): string {
    if (err instanceof HttpException) {
      const body = err.getResponse();
      if (typeof body === 'string') {
        return body;
      }
      if (typeof body === 'object' && body !== null && 'message' in body) {
        const msg = (body as { message: string | string[] }).message;
        return Array.isArray(msg) ? msg[0] ?? 'Không thực hiện được' : msg;
      }
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'Không thực hiện được';
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

    const view = await this.pkService.joinRoom(deviceId, payload.roomId, payload.password);
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
    const view = await this.pkService.getRoomViewForDevice(deviceId, payload.roomId);
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

    try {
      const result = await this.pkService.leaveRoom(deviceId, roomId);
      this.presenceService.markIntentionalLeave(client.id);
      await client.leave(this.roomChannel(roomId));
      client.data.roomId = undefined;
      return result;
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException) {
        return this.actionError(err);
      }
      throw err;
    }
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:set-ready')
  async handleSetReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; ready: boolean },
  ) {
    const deviceId = client.data.deviceId as string;
    return this.pkService.setReady(deviceId, payload.roomId, payload.ready);
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:switch-team')
  async handleSwitchTeam(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const deviceId = client.data.deviceId as string;
    return this.pkService.switchTeam(deviceId, payload.roomId);
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:start')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const deviceId = client.data.deviceId as string;
    try {
      return await this.pkService.startMatch(deviceId, payload.roomId);
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof ForbiddenException) {
        return this.actionError(err);
      }
      throw err;
    }
  }

  @UseGuards(WsDeviceIdGuard)
  @SubscribeMessage('room:kick')
  async handleKick(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; targetAccountId: string },
  ) {
    const deviceId = client.data.deviceId as string;
    const view = await this.pkService.kickMember(deviceId, payload.roomId, payload.targetAccountId);
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
    const result = await this.pkService.registerMokHit(deviceId, payload.roomId);
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
          const view = await this.pkService.getRoomViewForDevice(deviceId, roomId);
          remote.emit('room:state', view);
        } catch {
          /* member may have just left */
        }
      }),
    );
  }
}
