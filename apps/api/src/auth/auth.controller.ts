import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

export const AUTH_LOGIN_RATE_LIMIT =
  process.env.NODE_ENV === 'production' ? 5 : 20;
export const AUTH_LOGIN_RATE_TTL_MS = 60_000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: { limit: AUTH_LOGIN_RATE_LIMIT, ttl: AUTH_LOGIN_RATE_TTL_MS },
  })
  login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }
}
