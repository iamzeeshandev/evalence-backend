import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsString,
} from 'class-validator';

export class SaveAnswerDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  attemptId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  questionId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsArray()
  @ArrayNotEmpty()
  selectedOptionIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentIncrementSec?: number;
}
