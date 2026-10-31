import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { CoCultivationRoomStatus } from './co-cultivation-room-status.enum';
import { CoCultivationRoomMemberEntity } from './co-cultivation-room-member.entity';
import { CoCultivationSessionEntity } from './co-cultivation-session.entity';

@Entity('co_cultivation_rooms')
export class CoCultivationRoomEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_code', type: 'varchar', length: 16, unique: true })
  roomCode!: string;

  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 128, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'host_account_id', type: 'uuid' })
  hostAccountId!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: CoCultivationRoomStatus.WAITING,
  })
  status!: CoCultivationRoomStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'host_account_id' })
  host!: AccountEntity;

  @ManyToOne(() => CoCultivationSessionEntity, (session) => session.rooms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: CoCultivationSessionEntity;

  @OneToMany(() => CoCultivationRoomMemberEntity, (member) => member.room)
  members!: CoCultivationRoomMemberEntity[];
}
