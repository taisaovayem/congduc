import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PkMode } from './pk-mode.enum';
import { PkRoomMemberEntity } from './pk-room-member.entity';
import { PkRoomStatus } from './pk-room-status.enum';

@Entity('pk_rooms')
export class PkRoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_code', type: 'varchar', length: 16 })
  roomCode!: string;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 128, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'host_account_id', type: 'uuid' })
  hostAccountId!: string;

  @Column({ type: 'varchar', length: 16, default: PkRoomStatus.WAITING })
  status!: PkRoomStatus;

  @Column({ name: 'team_size', type: 'int', default: 1 })
  teamSize!: number;

  @Column({ type: 'varchar', length: 24, default: PkMode.FRIENDLY })
  mode!: PkMode;

  @Column({ name: 'stake_amount', type: 'bigint', nullable: true })
  stakeAmount!: string | null;

  @Column({ name: 'duration_minutes', type: 'int', default: 1 })
  durationMinutes!: number;

  @Column({ name: 'match_started_at', type: 'timestamptz', nullable: true })
  matchStartedAt!: Date | null;

  @Column({ name: 'match_ends_at', type: 'timestamptz', nullable: true })
  matchEndsAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => PkRoomMemberEntity, (member) => member.room)
  members!: PkRoomMemberEntity[];
}
