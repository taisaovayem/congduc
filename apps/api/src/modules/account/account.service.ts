import { Injectable, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MeritLedgerService } from '../merit-ledger/merit-ledger.service';
import { AccountEntity } from './entities/account.entity';
import { AccountRepository } from './repositories/account.repository';

export interface AccountProfile {
  id: string;
  deviceId: string;
  meritPoints: string;
}

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly meritLedgerService: MeritLedgerService,
  ) {}

  async ensureSession(deviceId?: string): Promise<{ account: AccountProfile; deviceId: string }> {
    const resolvedDeviceId = deviceId && deviceId.length > 0 ? deviceId : uuidv4();
    let account = await this.accountRepository.findByDeviceId(resolvedDeviceId);
    if (!account) {
      account = await this.accountRepository.createAccount(resolvedDeviceId);
    }
    await this.meritLedgerService.ensureBalanceRow(account.id);
    return {
      deviceId: resolvedDeviceId,
      account: await this.toProfile(account),
    };
  }

  async getProfileByDeviceId(deviceId: string): Promise<AccountProfile> {
    const account = await this.requireAccountByDeviceId(deviceId);
    return this.toProfile(account);
  }

  async requireAccountByDeviceId(deviceId: string): Promise<AccountEntity> {
    const account = await this.accountRepository.findByDeviceId(deviceId);
    if (!account) {
      throw new UnauthorizedException('Thiết bị chưa có tài khoản. Gọi API khởi tạo session trước.');
    }
    return account;
  }

  private async toProfile(account: AccountEntity): Promise<AccountProfile> {
    const meritPoints = await this.meritLedgerService.getBalance(account.id);
    return {
      id: account.id,
      deviceId: account.deviceId,
      meritPoints,
    };
  }
}
