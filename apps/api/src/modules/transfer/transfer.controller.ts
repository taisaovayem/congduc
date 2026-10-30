import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DeviceId } from '../../common/decorators/device-id.decorator';
import { DeviceIdGuard } from '../../common/guards/device-id.guard';
import { ConfirmTransferCommand } from './commands/confirm-transfer.command';
import { CreateSendTransferCommand } from './commands/create-send-transfer.command';
import { JoinReceiveTransferCommand } from './commands/join-receive-transfer.command';
import { ConfirmTransferDto } from './dto/confirm-transfer.dto';
import { CreateSendTransferDto } from './dto/create-send-transfer.dto';
import { CancelTransferDto } from './dto/cancel-transfer.dto';
import { JoinReceiveTransferDto } from './dto/join-receive-transfer.dto';
import { TransferService } from './transfer.service';

@Controller('transfers')
@UseGuards(DeviceIdGuard)
export class TransferController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly transferService: TransferService,
  ) {}

  @Post('send')
  createSend(@DeviceId() deviceId: string, @Body() body: CreateSendTransferDto) {
    const amount = body.mode === 'all' ? 'all' : (body.amount ?? 0);
    return this.commandBus.execute(new CreateSendTransferCommand(deviceId!, amount));
  }

  @Post('receive/join')
  joinReceive(@DeviceId() deviceId: string, @Body() body: JoinReceiveTransferDto) {
    return this.commandBus.execute(
      new JoinReceiveTransferCommand(deviceId!, body.transactionCode.toUpperCase()),
    );
  }

  @Post('confirm')
  confirm(@DeviceId() deviceId: string, @Body() body: ConfirmTransferDto) {
    return this.commandBus.execute(
      new ConfirmTransferCommand(
        deviceId!,
        body.transactionCode.toUpperCase(),
        body.confirmationCode,
        body.role,
      ),
    );
  }

  @Get('status/:transactionCode')
  getStatus(@DeviceId() deviceId: string, @Param('transactionCode') transactionCode: string) {
    return this.transferService.getTransferStatus(deviceId, transactionCode.toUpperCase());
  }

  @Post('cancel')
  cancel(@DeviceId() deviceId: string, @Body() body: CancelTransferDto) {
    return this.transferService.cancelTransfer(
      deviceId!,
      body.transactionCode.toUpperCase(),
      body.confirmationCode,
    );
  }
}
