import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IncenseService } from '../../incense/incense.service';
import { AccountService } from '../account.service';
import { GetAccountProfileQuery } from './get-account-profile.query';

@QueryHandler(GetAccountProfileQuery)
export class GetAccountProfileHandler implements IQueryHandler<GetAccountProfileQuery> {
  constructor(
    private readonly accountService: AccountService,
    private readonly incenseService: IncenseService,
  ) {}

  async execute(query: GetAccountProfileQuery) {
    const account = await this.accountService.requireAccountByDeviceId(query.deviceId);
    await this.incenseService.creditPendingMerit(account.id);
    return this.accountService.getProfileByDeviceId(query.deviceId);
  }
}
