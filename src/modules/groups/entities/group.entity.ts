import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  JoinTable,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { GroupUser } from './group-user.entity';
import { Company } from '../../company/entities/company.entity';
import { BatteryGroupAssignment } from '../../battery-assignment/entities/battery-group-assignment.entity';
import { BatteryProgress } from '../../battery-progress/entities/battery-progress.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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

  @OneToMany(() => GroupUser, (gu) => gu.group)
  groupUsers: GroupUser[];

  @ManyToOne(() => Company, (company) => company.groups)
  company: Company;

  @OneToMany(() => BatteryGroupAssignment, (assignment) => assignment.group)
  batteryAssignments: BatteryGroupAssignment[];

  @OneToMany(() => BatteryProgress, (progress) => progress.group)
  batteryProgress: BatteryProgress[];
}
