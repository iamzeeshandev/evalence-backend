import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Battery } from './battery.entity';
import { Test } from 'src/modules/test/entities/test.entity';

@Entity('battery_tests')
@Unique(['batteryId', 'testId'])
export class BatteryTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  batteryId: string;

  @Column({ type: 'uuid' })
  testId: string;

  // Weight as percentage of the battery completion (0-100). Sum across a battery may equal 100.
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  weight: number;

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

  @ManyToOne(() => Battery, (battery) => battery.batteryTests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batteryId' })
  battery: Battery;

  @ManyToOne(() => Test, (test) => test.batteryTests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'testId' })
  test: Test;
}
