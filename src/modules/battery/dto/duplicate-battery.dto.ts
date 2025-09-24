import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DuplicateBatteryDto {
  @ApiProperty({ 
    example: 'Mathematics Assessment Battery - Copy',
    description: 'Name for the duplicated battery'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'A copy of the original mathematics assessment battery',
    description: 'Optional description for the duplicated battery'
  })
  @IsString()
  @IsOptional()
  description?: string;
}
