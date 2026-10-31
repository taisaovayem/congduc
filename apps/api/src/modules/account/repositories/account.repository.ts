import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateNickname } from '../../../common/utils/code.util';
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
    const entity = this.repo.create({ deviceId, nickname: generateNickname() });
    return this.repo.save(entity);
  }

  async updateNickname(accountId: string, nickname: string): Promise<AccountEntity> {
    await this.repo.update({ id: accountId }, { nickname });
    const account = await this.findById(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found after nickname update`);
    }
    return account;
  }
}
