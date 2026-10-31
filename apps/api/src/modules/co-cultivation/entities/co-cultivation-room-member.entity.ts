import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { CoCultivationRoomEntity } from './co-cultivation-room.entity';

@Entity('co_cultivation_room_members')
@Unique('UQ_co_cultivation_room_members_room_account', ['roomId', 'accountId'])
export class CoCultivationRoomMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ name: 'is_ready', type: 'boolean', default: false })
  isReady!: boolean;

  @Column({ name: 'is_participating', type: 'boolean', default: false })
  isParticipating!: boolean;

  @Column({ name: 'personal_merit_hits', type: 'bigint', default: '0' })
  personalMeritHits!: string;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt!: Date;

  @ManyToOne(() => CoCultivationRoomEntity, (room) => room.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room!: CoCultivationRoomEntity;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;
}
