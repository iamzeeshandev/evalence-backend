import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Test } from 'src/modules/test/entities/test.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { AttemptStatus } from 'src/enums/attempt.enum';
import { UserTestAssignment } from '../../test-assignment/entities/user-test-assignments.entity';

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
  userAssignmentId: string | null;

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

  @ManyToOne(() => UserTestAssignment, { onDelete: 'CASCADE' })
  userAssignment: UserTestAssignment;
}
