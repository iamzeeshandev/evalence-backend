import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  JoinColumn,
} from 'typeorm';
import { TestAssignment } from './test-assignment.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('user_test_assignments')
@Unique(['assignmentId', 'userId'])
export class UserTestAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  assignmentId: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column({ type: 'int', nullable: true })
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

  @ManyToOne(() => TestAssignment, (assignment) => assignment.userAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'assignmentId' })
  assignment: TestAssignment;

  @ManyToOne(() => User, (user) => user.userTestAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
