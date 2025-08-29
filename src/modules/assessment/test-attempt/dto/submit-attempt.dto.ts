import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';
export class SubmitAttemptDto {
  @ApiProperty()
  @IsUUID()
  attemptId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  finalTimeSpentSec?: number;
}
