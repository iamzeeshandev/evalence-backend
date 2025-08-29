import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
  Delete,
  Param,
  Get,
  Query,
  Res,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { S3Service } from 'src/s3/s3.service';

class UploadFileDto {
  folder?: string;
  fileName?: string;
}

@ApiTags('Files')
@Controller('files')
export class UploadController {
  private maxFileSize: number;
  private allowedFileTypes: string[];

  constructor(
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    // Initialize validation settings
    this.maxFileSize =
      this.configService.get<number>('upload.maxFileSize') || 10 * 1024 * 1024;
    this.allowedFileTypes = this.configService.get<string[]>(
      'upload.allowedFileTypes',
    ) || ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          nullable: true,
          description: 'Optional folder path within the bucket',
        },
        fileName: {
          type: 'string',
          nullable: true,
          description: 'Optional custom file name',
        },
      },
    },
  })
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadFileDto,
  ) {
    this.validateFile(file);

    try {
      const result = await this.s3Service.uploadFile(
        file,
        body.folder,
        body.fileName,
      );

      return {
        success: true,
        message: 'File uploaded successfully',
        data: result,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          nullable: true,
          description: 'Optional folder path within the bucket',
        },
      },
    },
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadFileDto,
  ) {
    files.forEach((file) => this.validateFile(file));

    try {
      const results = await this.s3Service.uploadMultipleFiles(
        files,
        body.folder,
      );

      return {
        success: true,
        message: 'Files uploaded successfully',
        data: results,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  private validateFile(file: Express.Multer.File) {
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
  }

  // ... rest of the methods remain the same
  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(@Param('key') key: string) {
    try {
      await this.s3Service.deleteFile(key);

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('signed-url/:key')
  @ApiOperation({ summary: 'Generate a signed URL for a file' })
  async getSignedUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn: string = '3600',
  ) {
    try {
      const url = await this.s3Service.getSignedUrl(key, parseInt(expiresIn));

      return {
        success: true,
        data: { url },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('download/:key')
  @Header('Content-Type', 'application/octet-stream')
  @Header('Content-Disposition', 'attachment')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Param('key') key: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const stream = await this.s3Service.getFileStream(key);

      // Extract filename from key for content-disposition
      const fileName = key.split('/').pop();
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );

      return new StreamableFile(stream);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('exists/:key')
  @ApiOperation({ summary: 'Check if a file exists' })
  async fileExists(@Param('key') key: string) {
    try {
      const exists = await this.s3Service.fileExists(key);

      return {
        success: true,
        data: { exists },
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
