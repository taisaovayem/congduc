import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DeviceIdGuard } from '../../common/guards/device-id.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeviceId } from '../../common/decorators/device-id.decorator';
import { StartIncenseCommand } from './commands/start-incense.command';
import { GetActiveIncenseQuery } from './queries/get-active-incense.query';

@Controller('incense')
@UseGuards(DeviceIdGuard)
export class IncenseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('start')
  start(@DeviceId() deviceId: string) {
    return this.commandBus.execute(new StartIncenseCommand(deviceId!));
  }

  @Get('active')
  active(@DeviceId() deviceId: string) {
    return this.queryBus.execute(new GetActiveIncenseQuery(deviceId!));
  }
}
