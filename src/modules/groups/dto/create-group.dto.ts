import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'Development Team' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'A group for development team members',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['user-uuid-1', 'user-uuid-2'],
    description: 'Array of user IDs to add to this group',
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  userIds?: string[];

  @ApiProperty({ example: 'company-uuid' })
  @IsNotEmpty()
  @IsUUID(4)
  companyId: string;
}
