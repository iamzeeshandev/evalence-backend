import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { UserRole } from 'src/enums/user-role.enum';
import { TestAttempt } from 'src/modules/assessment/test-attempt/entities/test-attempt.entity';
import { Group } from '../../groups/entities/group.entity';
import { GroupUser } from '../../groups/entities/group-user.entity';
import { BatteryProgress } from '../../battery-progress/entities/battery-progress.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDeleted: boolean;

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

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @ManyToOne(() => Company, (company) => company.users)
  company: Company;

  @OneToMany(() => TestAttempt, (ta) => ta.user)
  testAttempts: TestAttempt[];

  @OneToMany(() => GroupUser, (gu) => gu.user)
  groupMemberships: GroupUser[];

  @OneToMany(() => BatteryProgress, (progress) => progress.user)
  batteryProgress: BatteryProgress[];
}
