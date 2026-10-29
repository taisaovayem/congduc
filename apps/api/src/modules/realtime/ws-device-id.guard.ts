import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsDeviceIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const deviceId = this.resolveDeviceId(client);

    if (!deviceId) {
      throw new WsException('Thiếu deviceId trong handshake');
    }

    client.data.deviceId = deviceId;
    return true;
  }

  resolveDeviceId(client: Socket): string | undefined {
    const fromAuth = client.handshake.auth?.deviceId;
    const fromHeader = client.handshake.headers['x-device-id'];
    return (
      (typeof fromAuth === 'string' && fromAuth) ||
      (typeof fromHeader === 'string' && fromHeader) ||
      undefined
    );
  }
}
