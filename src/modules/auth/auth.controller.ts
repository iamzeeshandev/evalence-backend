import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorators/auth.decorator';
import { AuthResponseDto, SignupResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthenticatedUser } from './interfaces/auth.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  async signIn(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    console.log('loginDto', loginDto);
    return await this.authService.signIn(loginDto);
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User registration' })
  async signup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
    return await this.authService.signup(signupDto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
  async logout(): Promise<{ message: string }> {
    return { message: 'Logout successful' };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
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
  testToken(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Token is valid',
      timestamp: new Date().toISOString(),
      user: user,
    };
  }
}
