import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';

export enum TransferStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('merit_transfers')
export class TransferEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'sender_account_id', type: 'uuid' })
  senderAccountId!: string;

  @ManyToOne(() => AccountEntity, (account) => account.sentTransfers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_account_id' })
  sender!: AccountEntity;

  @Column({ name: 'receiver_account_id', type: 'uuid', nullable: true })
  receiverAccountId!: string | null;

  @ManyToOne(() => AccountEntity, (account) => account.receivedTransfers, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'receiver_account_id' })
  receiver!: AccountEntity | null;

  @Column({ type: 'bigint' })
  amount!: string;

  @Column({ type: 'enum', enum: TransferStatus, default: TransferStatus.PENDING })
  status!: TransferStatus;

  @Column({ name: 'transaction_code', type: 'varchar', length: 8, unique: true })
  transactionCode!: string;

  @Column({ name: 'confirmation_code', type: 'varchar', length: 6 })
  confirmationCode!: string;

  @Column({ name: 'sender_confirmed', type: 'boolean', default: false })
  senderConfirmed!: boolean;

  @Column({ name: 'receiver_confirmed', type: 'boolean', default: false })
  receiverConfirmed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
