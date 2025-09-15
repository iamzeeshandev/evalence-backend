import { Test } from 'src/modules/test/entities/test.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @ManyToMany(() => Test, (test) => test.batteries, { cascade: false })
  @JoinTable({
    name: 'battery_tests',
    joinColumn: {
      name: 'batteryId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'testId',
      referencedColumnName: 'id',
    },
  })
  tests: Test[];
}
