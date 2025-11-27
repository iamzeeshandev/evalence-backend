import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PsychometricAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiProperty({
    description: 'Selected Option ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsUUID()
  optionId: string;
}

export class SubmitPsychometricTestDto {
  @ApiProperty({
    description: 'Test ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsNotEmpty()
  @IsUUID()
  testId: string;

  @ApiProperty({
    description: 'User ID (employee taking the test)',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Array of answers',
    type: [PsychometricAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PsychometricAnswerDto)
  answers: PsychometricAnswerDto[];
}

export class PsychometricScoreResponseDto {
  @ApiProperty({ description: 'Test attempt ID' })
  attemptId: string;

  @ApiProperty({ description: 'Total score achieved' })
  totalScore: number;

  @ApiProperty({ description: 'Maximum possible score' })
  maxPossibleScore: number;

  @ApiProperty({ description: 'Score percentage' })
  percentage: number;

  @ApiProperty({ description: 'Dimension-wise scores', required: false })
  dimensionScores?: {
    dimension: string;
    score: number;
    maxScore: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Test completion timestamp' })
  completedAt: Date;
}
