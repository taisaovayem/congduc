import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IncenseService } from '../../incense/incense.service';
import { AccountService } from '../account.service';
import { EnsureSessionCommand } from './ensure-session.command';

@CommandHandler(EnsureSessionCommand)
export class EnsureSessionHandler implements ICommandHandler<EnsureSessionCommand> {
  constructor(
    private readonly accountService: AccountService,
    private readonly incenseService: IncenseService,
  ) {}

  async execute(command: EnsureSessionCommand) {
    const session = await this.accountService.ensureSession(command.deviceId);
    await this.incenseService.creditPendingMerit(session.account.id);
    const account = await this.accountService.getProfileByDeviceId(session.deviceId);
    return { deviceId: session.deviceId, account };
  }
}
