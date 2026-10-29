import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncenseSessionEntity } from '../entities/incense-session.entity';

@Injectable()
export class IncenseRepository {
  constructor(
    @InjectRepository(IncenseSessionEntity)
    private readonly repo: Repository<IncenseSessionEntity>,
  ) {}

  findActiveByAccountId(accountId: string): Promise<IncenseSessionEntity | null> {
    return this.repo.findOne({
      where: { accountId, isActive: true },
      order: { startedAt: 'DESC' },
    });
  }

  findAllActive(): Promise<IncenseSessionEntity[]> {
    return this.repo.find({ where: { isActive: true } });
  }

  createSession(data: {
    accountId: string;
    startedAt: Date;
    endsAt: Date;
    lastCreditedAt: Date;
  }): Promise<IncenseSessionEntity> {
    const entity = this.repo.create({
      accountId: data.accountId,
      startedAt: data.startedAt,
      endsAt: data.endsAt,
      lastCreditedAt: data.lastCreditedAt,
      isActive: true,
    });
    return this.repo.save(entity);
  }

  async save(session: IncenseSessionEntity): Promise<IncenseSessionEntity> {
    return this.repo.save(session);
  }

  async deactivate(id: string): Promise<void> {
    await this.repo.update({ id }, { isActive: false });
  }
}
