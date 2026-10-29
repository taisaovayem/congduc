import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class DeviceIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const deviceId = request.headers['x-device-id'];
    if (!deviceId || typeof deviceId !== 'string') {
      throw new BadRequestException('Header X-Device-Id là bắt buộc');
    }
    return true;
  }
}
