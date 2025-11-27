import { TestAttempt } from 'src/modules/assessment/test-attempt/entities/test-attempt.entity';
import { Question } from 'src/modules/question/entities/question.entity';
import { BatteryTest } from 'src/modules/battery/entities/battery-test.entity';
import { ScoringStandard } from 'src/enums/question.enum';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 60 })
  duration: number;

  @Column({
    type: 'enum',
    enum: ['STANDARD', 'PSYCHOMETRIC'],
    default: 'STANDARD',
  })
  testCategory: 'STANDARD' | 'PSYCHOMETRIC';

  @Column({
    type: 'enum',
    enum: ScoringStandard,
    nullable: true,
  })
  scoringStandard: ScoringStandard;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

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

  @OneToMany(() => Question, (question) => question.test, { cascade: true })
  questions: Question[];

  @OneToMany(() => TestAttempt, (ta) => ta.test)
  testAttempts: TestAttempt[];

  @OneToMany(() => BatteryTest, (bt) => bt.test)
  batteryTests: BatteryTest[];
}
