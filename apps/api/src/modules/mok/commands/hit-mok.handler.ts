import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { MokService } from '../mok.service';
import { HitMokCommand } from './hit-mok.command';

@CommandHandler(HitMokCommand)
export class HitMokHandler implements ICommandHandler<HitMokCommand> {
  constructor(private readonly mokService: MokService) {}

  execute(command: HitMokCommand) {
    return this.mokService.registerHit(command.deviceId);
  }
}
