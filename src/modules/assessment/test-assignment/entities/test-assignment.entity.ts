import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  OneToMany,
} from 'typeorm';
import { Test } from 'src/modules/test/entities/test.entity';
import { Company } from 'src/modules/company/entities/company.entity';
import { UserTestAssignment } from './user-test-assignments.entity';

@Entity('test_assignments')
@Unique(['testId', 'companyId'])
export class TestAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  testId: string;

  @Index()
  @Column({ nullable: true })
  companyId: string;

  @Column({ type: 'int', default: 1 })
  maxAttempts: number;

  @Column({ type: 'datetime', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'boolean', default: true })
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

  @ManyToOne(() => Test, { onDelete: 'CASCADE' })
  test: Test;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @OneToMany(() => UserTestAssignment, (uta) => uta.assignment, {
    cascade: ['remove'],
  })
  userAssignments: UserTestAssignment[];
}
