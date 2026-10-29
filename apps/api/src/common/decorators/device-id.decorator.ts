import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const DeviceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const raw = request.headers['x-device-id'];
    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
  },
);
