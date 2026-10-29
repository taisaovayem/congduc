import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { generateConfirmationCode, generateTransactionCode } from '../../common/utils/code.util';
import { parseMerit } from '../../common/utils/merit.util';
import { AccountService } from '../account/account.service';
import { IncenseService } from '../incense/incense.service';
import { MeritLedgerService } from '../merit-ledger/merit-ledger.service';
import { TransferStatus } from './entities/transfer.entity';
import { TransferRepository } from './repositories/transfer.repository';

@Injectable()
export class TransferService {
  constructor(
    private readonly transferRepository: TransferRepository,
    private readonly accountService: AccountService,
    private readonly meritLedgerService: MeritLedgerService,
    private readonly incenseService: IncenseService,
  ) {}

  async createSendTransfer(
    deviceId: string,
    amountInput: number | 'all',
  ): Promise<{
    transferId: string;
    transactionCode: string;
    confirmationCode: string;
    amount: string;
  }> {
    const sender = await this.accountService.requireAccountByDeviceId(deviceId);
    await this.incenseService.creditPendingMerit(sender.id);
    const balance = parseMerit(await this.meritLedgerService.getBalance(sender.id));
    const amount =
      amountInput === 'all'
        ? balance
        : BigInt(Math.floor(amountInput));

    if (amount <= 0n) {
      throw new BadRequestException('Số công đức chuyển phải lớn hơn 0');
    }
    if (amount > balance) {
      throw new BadRequestException('Không đủ công đức để chuyển');
    }

    const transactionCode = generateTransactionCode();
    const confirmationCode = generateConfirmationCode();
    const transfer = await this.transferRepository.createTransfer({
      senderAccountId: sender.id,
      amount: amount.toString(),
      transactionCode,
      confirmationCode,
    });

    return {
      transferId: transfer.id,
      transactionCode: transfer.transactionCode,
      confirmationCode: transfer.confirmationCode,
      amount: transfer.amount,
    };
  }

  async joinReceiveTransfer(deviceId: string, transactionCode: string): Promise<{ transferId: string }> {
    const receiver = await this.accountService.requireAccountByDeviceId(deviceId);
    const transfer = await this.transferRepository.findByTransactionCode(transactionCode);
    if (!transfer || transfer.status !== TransferStatus.PENDING) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }
    if (transfer.senderAccountId === receiver.id) {
      throw new BadRequestException('Không thể nhận giao dịch của chính mình');
    }
    if (transfer.receiverAccountId && transfer.receiverAccountId !== receiver.id) {
      throw new ForbiddenException('Giao dịch đã có người nhận khác');
    }

    transfer.receiverAccountId = receiver.id;
    await this.transferRepository.save(transfer);
    return { transferId: transfer.id };
  }

  async confirmTransfer(
    deviceId: string,
    transactionCode: string,
    confirmationCode: string,
    role: 'sender' | 'receiver',
  ): Promise<{ status: TransferStatus; meritPoints: string }> {
    const account = await this.accountService.requireAccountByDeviceId(deviceId);
    const transfer = await this.transferRepository.findByTransactionCode(transactionCode);
    if (!transfer || transfer.status !== TransferStatus.PENDING) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }
    if (transfer.confirmationCode !== confirmationCode) {
      throw new BadRequestException('Mã xác nhận không đúng');
    }

    if (role === 'sender') {
      if (transfer.senderAccountId !== account.id) {
        throw new ForbiddenException('Bạn không phải người gửi');
      }
      transfer.senderConfirmed = true;
    } else {
      if (transfer.receiverAccountId !== account.id) {
        throw new BadRequestException('Bạn cần chọn nhận giao dịch trước khi xác nhận');
      }
      transfer.receiverConfirmed = true;
    }

    await this.transferRepository.save(transfer);

    if (!transfer.senderConfirmed || !transfer.receiverConfirmed) {
      const meritPoints = (await this.accountService.getProfileByDeviceId(deviceId)).meritPoints;
      return { status: TransferStatus.PENDING, meritPoints };
    }

    return this.completeTransfer(transfer.id, deviceId);
  }

  private async completeTransfer(
    transferId: string,
    deviceId: string,
  ): Promise<{ status: TransferStatus; meritPoints: string }> {
    const transfer = await this.transferRepository.findById(transferId);
    if (!transfer || transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Giao dịch không hợp lệ');
    }
    if (!transfer.receiverAccountId) {
      throw new BadRequestException('Chưa có người nhận');
    }

    await this.incenseService.creditPendingMerit(transfer.senderAccountId);

    const amount = parseMerit(transfer.amount);
    try {
      await this.meritLedgerService.postTransfer(
        transfer.senderAccountId,
        transfer.receiverAccountId,
        amount,
        transfer.id,
      );
    } catch (err) {
      if (err instanceof BadRequestException) {
        transfer.status = TransferStatus.CANCELLED;
        await this.transferRepository.save(transfer);
      }
      throw err;
    }

    transfer.status = TransferStatus.COMPLETED;
    await this.transferRepository.save(transfer);

    const profile = await this.accountService.getProfileByDeviceId(deviceId);
    return {
      status: TransferStatus.COMPLETED,
      meritPoints: profile.meritPoints,
    };
  }
}
