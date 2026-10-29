import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransferEntity, TransferStatus } from '../entities/transfer.entity';

@Injectable()
export class TransferRepository {
  constructor(
    @InjectRepository(TransferEntity)
    private readonly repo: Repository<TransferEntity>,
  ) {}

  findByTransactionCode(code: string): Promise<TransferEntity | null> {
    return this.repo.findOne({ where: { transactionCode: code.toUpperCase() } });
  }

  findById(id: string): Promise<TransferEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  createTransfer(data: {
    senderAccountId: string;
    amount: string;
    transactionCode: string;
    confirmationCode: string;
  }): Promise<TransferEntity> {
    const entity = this.repo.create({
      senderAccountId: data.senderAccountId,
      amount: data.amount,
      transactionCode: data.transactionCode,
      confirmationCode: data.confirmationCode,
      status: TransferStatus.PENDING,
    });
    return this.repo.save(entity);
  }

  save(transfer: TransferEntity): Promise<TransferEntity> {
    return this.repo.save(transfer);
  }
}
