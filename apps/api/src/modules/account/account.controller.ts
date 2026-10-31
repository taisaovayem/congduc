import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { DeviceIdGuard } from '../../common/guards/device-id.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeviceId } from '../../common/decorators/device-id.decorator';
import { EnsureSessionCommand } from './commands/ensure-session.command';
import { UpdateNicknameCommand } from './commands/update-nickname.command';
import { EnsureSessionDto } from './dto/ensure-session.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
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

  @Patch('me/nickname')
  @UseGuards(DeviceIdGuard)
  updateNickname(@DeviceId() deviceId: string, @Body() body: UpdateNicknameDto) {
    return this.commandBus.execute(new UpdateNicknameCommand(deviceId!, body.nickname));
  }
}
