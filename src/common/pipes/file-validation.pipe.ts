import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private maxFileSize: number,
    private allowedFileTypes: string[],
  ) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds the limit of ${this.maxFileSize} bytes`,
      );
    }

    // Check MIME type
    if (!this.allowedFileTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}`,
      );
    }

    return file;
  }
}

// Factory function that can be used as a provider
export const FileValidationPipeFactory = {
  provide: FileValidationPipe,
  useFactory: (configService?: ConfigService) => {
    const maxFileSize =
      configService?.get<number>('upload.maxFileSize') || 10 * 1024 * 1024;
    const allowedFileTypes = configService?.get<string[]>(
      'upload.allowedFileTypes',
    ) || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

    return new FileValidationPipe(maxFileSize, allowedFileTypes);
  },
  inject: [ConfigService],
};
