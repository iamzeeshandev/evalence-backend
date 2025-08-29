import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/app-config.type';

@Injectable()
export class FileService {
  constructor(private configService: ConfigService<AppConfig>) {}

  generateFileUrl(filename: string): string {
    const baseUrl =
      this.configService.get('backendDomain', { infer: true }) ||
      'http://localhost:3000';
    return `${baseUrl}/uploads/${filename}`;
  }

  getFilePath(filename: string): string {
    return `./uploads/${filename}`;
  }
}
