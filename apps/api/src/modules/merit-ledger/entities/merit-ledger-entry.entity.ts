import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { MeritLedgerEntryType } from './merit-ledger-entry-type.enum';

@Entity('merit_ledger_entries')
export class MeritLedgerEntryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;

  /** Signed delta: positive = credit, negative = debit */
  @Column({ type: 'bigint' })
  amount!: string;

  @Column({ name: 'entry_type', type: 'enum', enum: MeritLedgerEntryType })
  entryType!: MeritLedgerEntryType;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId!: string | null;

  @Column({ name: 'balance_after', type: 'bigint' })
  balanceAfter!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
