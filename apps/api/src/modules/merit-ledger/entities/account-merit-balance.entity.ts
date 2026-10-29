import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';

/** Materialized balance for O(1) reads; updated only when posting ledger entries. */
@Entity('account_merit_balances')
export class AccountMeritBalanceEntity {
  @PrimaryColumn({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @OneToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;

  @Column({ type: 'bigint', default: 0 })
  balance!: string;

  @Column({ name: 'last_ledger_id', type: 'bigint', nullable: true })
  lastLedgerId!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
