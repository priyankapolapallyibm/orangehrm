import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
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
  private readonly expectedPasswordHash: Buffer;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const password =
      this.configService.get<string>('DEMO_ADMIN_PASSWORD') ?? 'admin123';
    this.expectedPasswordHash = scryptSync(password, PASSWORD_SALT, 64);
  }

  async login(credentials: LoginDto) {
    const username =
      this.configService.get<string>('DEMO_ADMIN_USERNAME') ?? 'Admin';
    const passwordMatches = await this.passwordsMatch(credentials.password);

    if (credentials.username !== username || !passwordMatches) {
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

  private passwordsMatch(candidate: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      scrypt(candidate, PASSWORD_SALT, 64, (error, candidateHash) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(timingSafeEqual(candidateHash, this.expectedPasswordHash));
      });
    });
  }
}
