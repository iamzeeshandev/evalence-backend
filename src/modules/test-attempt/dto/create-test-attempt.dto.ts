import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CreateTestAttemptDto {
  @ApiProperty()
  @IsString()
  testId: string;

  @ApiProperty()
  @IsString()
  userId: string;
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty()
  @IsString()
  optionId: string;
}

class SubmittedAnswerDto {
  @ApiProperty()
  @IsString()
  questionId: string;

  @ApiProperty()
  @IsString()
  optionId: string; // works for single & multiple
}

export class SubmitTestDto {
  @ApiProperty()
  @IsString()
  attemptId: string;

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmittedAnswerDto)
  answers: SubmittedAnswerDto[];
}
