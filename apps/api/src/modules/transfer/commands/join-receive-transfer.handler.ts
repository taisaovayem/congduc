import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransferService } from '../transfer.service';
import { JoinReceiveTransferCommand } from './join-receive-transfer.command';

@CommandHandler(JoinReceiveTransferCommand)
export class JoinReceiveTransferHandler implements ICommandHandler<JoinReceiveTransferCommand> {
  constructor(private readonly transferService: TransferService) {}

  execute(command: JoinReceiveTransferCommand) {
    return this.transferService.joinReceiveTransfer(
      command.deviceId,
      command.transactionCode,
    );
  }
}
