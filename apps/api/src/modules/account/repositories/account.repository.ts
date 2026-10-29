import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';

@Injectable()
export class AccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
  ) {}

  findByDeviceId(deviceId: string): Promise<AccountEntity | null> {
    return this.repo.findOne({ where: { deviceId } });
  }

  findById(id: string): Promise<AccountEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  createAccount(deviceId: string): Promise<AccountEntity> {
    const entity = this.repo.create({ deviceId });
    return this.repo.save(entity);
  }
}
