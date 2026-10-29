import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IncenseSessionEntity } from '../../incense/entities/incense-session.entity';
import { TransferEntity } from '../../transfer/entities/transfer.entity';

@Entity('accounts')
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'device_id', type: 'uuid', unique: true })
  deviceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => IncenseSessionEntity, (session) => session.account)
  incenseSessions!: IncenseSessionEntity[];

  @OneToMany(() => TransferEntity, (transfer) => transfer.sender)
  sentTransfers!: TransferEntity[];

  @OneToMany(() => TransferEntity, (transfer) => transfer.receiver)
  receivedTransfers!: TransferEntity[];
}
