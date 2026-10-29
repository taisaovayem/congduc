import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransferService } from '../transfer.service';
import { ConfirmTransferCommand } from './confirm-transfer.command';

@CommandHandler(ConfirmTransferCommand)
export class ConfirmTransferHandler implements ICommandHandler<ConfirmTransferCommand> {
  constructor(private readonly transferService: TransferService) {}

  execute(command: ConfirmTransferCommand) {
    return this.transferService.confirmTransfer(
      command.deviceId,
      command.transactionCode,
      command.confirmationCode,
      command.role,
    );
  }
}
