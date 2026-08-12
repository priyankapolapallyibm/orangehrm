import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { scrypt, scryptSync, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';

const DUMMY_SALT = 'peopleflow-invalid-user';
const DUMMY_HASH = scryptSync('invalid-password', DUMMY_SALT, 64);

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
    private readonly prisma: PrismaService,
  ) {}

  async login(credentials: LoginDto) {
    const account = await this.prisma.user.findUnique({
      where: { username: credentials.username },
    });
    const passwordMatches = await this.passwordsMatch(
      credentials.password,
      account?.passwordSalt ?? DUMMY_SALT,
      account ? Buffer.from(account.passwordHash, 'base64') : DUMMY_HASH,
    );

    if (!account?.active || !passwordMatches) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const user: AuthenticatedUser = {
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      role: account.role,
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

  private passwordsMatch(
    candidate: string,
    salt: string,
    expectedHash: Buffer,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      scrypt(candidate, salt, 64, (error, candidateHash) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(
          candidateHash.length === expectedHash.length &&
            timingSafeEqual(candidateHash, expectedHash),
        );
      });
    });
  }
}
