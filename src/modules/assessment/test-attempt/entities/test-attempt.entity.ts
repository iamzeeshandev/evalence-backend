import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Test } from 'src/modules/test/entities/test.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { AttemptStatus } from 'src/enums/attempt.enum';
import { AttemptAnswer } from '../../attempt-answer/entities/attempt-answer.entity';
import { Battery } from 'src/modules/battery/entities/battery.entity';

@Entity('test_attempts')
@Index(['testId', 'userId'])
export class TestAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  testId: string;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  batteryId: string;

  @Column({
    type: 'enum',
    enum: AttemptStatus,
    default: AttemptStatus.IN_PROGRESS,
  })
  status: AttemptStatus;

  @Column({ type: 'int', default: 0 })
  totalPoints: number;

  @Column({ type: 'int', default: 0 })
  awardedPoints: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentage: number;

  @Column({ type: 'int', default: 0 })
  correctCount: number;

  @Column({ type: 'int', default: 0 })
  questionCount: number;

  @Column({ type: 'int', default: 0 })
  timeSpentSec: number;

  @Column({ type: 'boolean', default: false })
  isTimedOut: boolean;

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @ManyToOne(() => Test, { onDelete: 'CASCADE' })
  test: Test;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Battery, { nullable: true, onDelete: 'SET NULL' })
  battery: Battery;

  @OneToMany(() => AttemptAnswer, (aa) => aa.testAttempt)
  attemptAnswers: AttemptAnswer[];
}
