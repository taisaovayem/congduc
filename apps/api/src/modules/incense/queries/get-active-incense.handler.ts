import { UnauthorizedException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AccountRepository } from '../../account/repositories/account.repository';
import { IncenseService } from '../incense.service';
import { GetActiveIncenseQuery } from './get-active-incense.query';

@QueryHandler(GetActiveIncenseQuery)
export class GetActiveIncenseHandler implements IQueryHandler<GetActiveIncenseQuery> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly incenseService: IncenseService,
  ) {}

  async execute(query: GetActiveIncenseQuery) {
    const account = await this.accountRepository.findByDeviceId(query.deviceId);
    if (!account) {
      throw new UnauthorizedException('Thiết bị chưa có tài khoản');
    }
    return this.incenseService.getActiveIncense(account.id);
  }
}
