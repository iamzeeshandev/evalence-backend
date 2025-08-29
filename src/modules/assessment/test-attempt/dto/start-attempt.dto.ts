import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class StartAttemptDto {
  @ApiProperty()
  @IsUUID()
  testId: string;

  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userAssignmentId?: string;
}

export class ListAttemptsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  testId?: string;
}
