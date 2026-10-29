import { Inject, UnauthorizedException, forwardRef } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AccountRepository } from '../../account/repositories/account.repository';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { IncenseService } from '../incense.service';
import { StartIncenseCommand } from './start-incense.command';

@CommandHandler(StartIncenseCommand)
export class StartIncenseHandler implements ICommandHandler<StartIncenseCommand> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly incenseService: IncenseService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async execute(command: StartIncenseCommand) {
    const account = await this.accountRepository.findByDeviceId(command.deviceId);
    if (!account) {
      throw new UnauthorizedException('Thiết bị chưa có tài khoản');
    }
    const view = await this.incenseService.startIncense(account.id);
    await this.realtimeGateway.pushIncenseState(command.deviceId);
    return view;
  }
}
