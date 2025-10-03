import { Test } from 'src/modules/test/entities/test.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BatteryGroupAssignment } from '../../battery-assignment/entities/battery-group-assignment.entity';
import { BatteryProgress } from '../../battery-progress/entities/battery-progress.entity';
import { BatteryTest } from './battery-test.entity';

@Entity('batteries')
export class Battery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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

  @OneToMany(() => BatteryTest, (bt) => bt.battery)
  batteryTests: BatteryTest[];

  @OneToMany(() => BatteryGroupAssignment, (assignment) => assignment.battery)
  groupAssignments: BatteryGroupAssignment[];

  @OneToMany(() => BatteryProgress, (progress) => progress.battery)
  progressRecords: BatteryProgress[];
}
