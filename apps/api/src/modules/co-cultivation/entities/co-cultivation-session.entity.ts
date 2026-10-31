import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CoCultivationSessionStatus } from './co-cultivation-session-status.enum';
import { CoCultivationSessionParticipantEntity } from './co-cultivation-session-participant.entity';
import { CoCultivationRoomEntity } from './co-cultivation-room.entity';

@Entity('co_cultivation_sessions')
export class CoCultivationSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'room_code', type: 'varchar', length: 16 })
  roomCode!: string;

  @Column({ name: 'room_name', type: 'varchar', length: 64 })
  roomName!: string;

  @Column({ name: 'had_password', type: 'boolean', default: false })
  hadPassword!: boolean;

  @Column({
    type: 'varchar',
    length: 16,
    default: CoCultivationSessionStatus.OPEN,
  })
  status!: CoCultivationSessionStatus;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt!: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt!: Date | null;

  @OneToMany(() => CoCultivationRoomEntity, (room) => room.session)
  rooms!: CoCultivationRoomEntity[];

  @OneToMany(() => CoCultivationSessionParticipantEntity, (p) => p.session)
  participants!: CoCultivationSessionParticipantEntity[];
}
