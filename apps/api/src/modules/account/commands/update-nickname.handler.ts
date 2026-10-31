import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AccountService } from '../account.service';
import { UpdateNicknameCommand } from './update-nickname.command';

@CommandHandler(UpdateNicknameCommand)
export class UpdateNicknameHandler implements ICommandHandler<UpdateNicknameCommand> {
  constructor(private readonly accountService: AccountService) {}

  execute(command: UpdateNicknameCommand) {
    return this.accountService.updateNickname(command.deviceId, command.nickname);
  }
}
