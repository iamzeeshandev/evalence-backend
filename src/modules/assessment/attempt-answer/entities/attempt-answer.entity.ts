import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from 'src/modules/question/entities/question.entity';
import { TestAttempt } from '../../test-attempt/entities/test-attempt.entity';

@Entity('attempt_answers')
@Unique(['testAttemptId', 'questionId'])
@Index(['testAttemptId'])
export class AttemptAnswer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  testAttemptId: string;

  @Column('uuid')
  questionId: string;

  // Store selected option IDs as JSON for flexibility (supports multi-select)
  @Column({ type: 'json', nullable: true })
  selectedOptionIds: string[] | null;

  @Column({ type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

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

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  question: Question;

  // @ManyToOne(() => TestAttempt, { onDelete: 'CASCADE' })
  // testAttempt: TestAttempt;

  @ManyToOne(() => TestAttempt, (attempt) => attempt.attemptAnswers, {
    onDelete: 'CASCADE',
  })
  testAttempt: TestAttempt;
}
