import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PkRoomEntity } from './pk-room.entity';
import { PkTeam } from './pk-team.enum';

@Entity('pk_room_members')
@Unique('UQ_pk_room_members_room_account', ['roomId', 'accountId'])
export class PkRoomMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  team!: PkTeam | null;

  @Column({ name: 'is_spectator', type: 'boolean', default: false })
  isSpectator!: boolean;

  @Column({ name: 'is_fighter', type: 'boolean', default: false })
  isFighter!: boolean;

  @Column({ name: 'is_ready', type: 'boolean', default: false })
  isReady!: boolean;

  @Column({ name: 'match_merit_hits', type: 'bigint', default: '0' })
  matchMeritHits!: string;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt!: Date;

  @ManyToOne(() => PkRoomEntity, (room) => room.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room!: PkRoomEntity;
}
