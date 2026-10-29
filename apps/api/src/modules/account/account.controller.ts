import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DeviceIdGuard } from '../../common/guards/device-id.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeviceId } from '../../common/decorators/device-id.decorator';
import { EnsureSessionCommand } from './commands/ensure-session.command';
import { EnsureSessionDto } from './dto/ensure-session.dto';
import { GetAccountProfileQuery } from './queries/get-account-profile.query';

@Controller('accounts')
export class AccountController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('session')
  ensureSession(@Body() body: EnsureSessionDto) {
    return this.commandBus.execute(new EnsureSessionCommand(body.deviceId));
  }

  @Get('me')
  @UseGuards(DeviceIdGuard)
  getMe(@DeviceId() deviceId: string) {
    return this.queryBus.execute(new GetAccountProfileQuery(deviceId!));
  }
}
