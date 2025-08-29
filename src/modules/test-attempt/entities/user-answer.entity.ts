import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { TestAttempt } from "./test-attempt.entity";
import { Question } from "src/modules/question/entities/question.entity";
import { Option } from "src/modules/option/entities/option.entity";

@Entity("userAnswers")
export class UserAnswer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Option, {
    eager: true,
    nullable: true,
    onDelete: "SET NULL",
  })
  selectedOption: Option;

  @Column({ default: false })
  isCorrect: boolean;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updatedAt: Date;

  @ManyToOne(() => TestAttempt, (attempt) => attempt.answers, {
    onDelete: "CASCADE",
  })
  attempt: TestAttempt;

  @ManyToOne(() => Question, { eager: true, onDelete: "CASCADE" })
  question: Question;
}
