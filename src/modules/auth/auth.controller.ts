import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto, SignupResponseDto } from './dto/auth-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public, CurrentUser } from './decorators/auth.decorator';
import { AuthenticatedUser } from './interfaces/auth.interface';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password, returns JWT token with user and company details',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account deactivated',
  })
  async signIn(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    console.log('loginDto', loginDto);
    return await this.authService.signIn(loginDto);
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User registration',
    description:
      'Register a new user with minimal company details. Creates both user and company records.',
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: SignupResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({
    description: 'User email or company name already exists',
  })
  async signup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
    return await this.authService.signup(signupDto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout user (client-side token removal)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  async logout(): Promise<{ message: string }> {
    return { message: 'Logout successful' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('refresh-token')
  async refreshToken(@Req() request: Request) {
    console.log('authHeader:', request.headers.authorization);
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const refreshToken = authHeader.replace('Bearer ', '');
    return this.authService.refreshToken(refreshToken);
  }

  @Post('test-token')
  @ApiOperation({ summary: 'Test JWT token expiration' })
  @ApiResponse({
    status: 200,
    description: 'Token validation result',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        timestamp: { type: 'string' },
        user: { type: 'object' },
      },
    },
  })
  testToken(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Token is valid',
      timestamp: new Date().toISOString(),
      user: user,
    };
  }

  @Public()
  @Get('debug-env')
  @ApiOperation({ summary: 'Debug environment variables' })
  @ApiResponse({
    status: 200,
    description: 'Environment variables debug info',
    schema: {
      type: 'object',
      properties: {
        jwtExpiry: { type: 'string' },
        jwtSecret: { type: 'string' },
        allJwtVars: { type: 'object' },
      },
    },
  })
  debugEnv() {
    return {
      jwtExpiry: process.env.JWT_EXPIRY,
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      allJwtVars: Object.keys(process.env)
        .filter((key) => key.includes('JWT'))
        .reduce(
          (acc, key) => {
            acc[key] = process.env[key] ? 'SET' : 'NOT SET';
            return acc;
          },
          {} as Record<string, string>,
        ),
      timestamp: new Date().toISOString(),
    };
  }
}
