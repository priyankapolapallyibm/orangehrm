import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { LoginDto } from './dto/login.dto';

const PASSWORD_SALT = 'peopleflow-local-demo';

export interface AuthenticatedUser {
  id: number;
  username: string;
  displayName: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  login(credentials: LoginDto) {
    const username =
      this.configService.get<string>('DEMO_ADMIN_USERNAME') ?? 'Admin';
    const password =
      this.configService.get<string>('DEMO_ADMIN_PASSWORD') ?? 'admin123';

    if (
      credentials.username !== username ||
      !this.passwordsMatch(credentials.password, password)
    ) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const user: AuthenticatedUser = {
      id: 1,
      username,
      displayName: 'System Administrator',
      role: 'ADMIN',
    };

    return {
      accessToken: this.jwtService.sign({
        sub: user.id,
        username: user.username,
        role: user.role,
      }),
      user,
    };
  }

  private passwordsMatch(candidate: string, expected: string): boolean {
    const candidateHash = scryptSync(candidate, PASSWORD_SALT, 64);
    const expectedHash = scryptSync(expected, PASSWORD_SALT, 64);
    return timingSafeEqual(candidateHash, expectedHash);
  }
}
