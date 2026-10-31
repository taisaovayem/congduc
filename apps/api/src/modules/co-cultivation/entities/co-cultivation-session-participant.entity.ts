import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { CoCultivationSessionEntity } from './co-cultivation-session.entity';

@Entity('co_cultivation_session_participants')
export class CoCultivationSessionParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Column({ type: 'varchar', length: 32 })
  nickname!: string;

  @Column({ name: 'personal_merit_hits', type: 'bigint', default: '0' })
  personalMeritHits!: string;

  @Column({ name: 'bonus_merit_received', type: 'bigint', default: '0' })
  bonusMeritReceived!: string;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt!: Date | null;

  @ManyToOne(() => CoCultivationSessionEntity, (session) => session.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session!: CoCultivationSessionEntity;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account!: AccountEntity;
}
