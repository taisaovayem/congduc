import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransferService } from '../transfer.service';
import { CreateSendTransferCommand } from './create-send-transfer.command';

@CommandHandler(CreateSendTransferCommand)
export class CreateSendTransferHandler implements ICommandHandler<CreateSendTransferCommand> {
  constructor(private readonly transferService: TransferService) {}

  execute(command: CreateSendTransferCommand) {
    return this.transferService.createSendTransfer(command.deviceId, command.amount);
  }
}
