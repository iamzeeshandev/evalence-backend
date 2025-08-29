import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { S3Module } from 'src/s3/s3.module';
import { FileValidationPipeFactory } from 'src/common/pipes/file-validation.pipe';

@Module({
  imports: [ConfigModule, S3Module],
  controllers: [UploadController],
  providers: [
    FileValidationPipeFactory,
    {
      provide: 'FILE_VALIDATION_CONFIG',
      useFactory: (configService: ConfigService) => ({
        maxFileSize:
          configService.get<number>('upload.maxFileSize') || 10 * 1024 * 1024,
        allowedFileTypes: configService.get<string[]>(
          'upload.allowedFileTypes',
        ) || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      }),
      inject: [ConfigService],
    },
  ],
})
export class UploadModule {}
