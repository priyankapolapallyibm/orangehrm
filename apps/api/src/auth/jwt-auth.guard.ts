import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';

interface JwtUser {
  sub: number;
  username: string;
  role: string;
}

type AuthenticatedRequest = Request & { user?: JwtUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication is required');
    }

    try {
      const claims = await this.jwtService.verifyAsync<JwtUser>(token);
      const account = await this.prisma.user.findUnique({
        where: { id: claims.sub },
        select: { id: true, username: true, role: true, active: true },
      });
      if (
        !account?.active ||
        account.username !== claims.username ||
        account.role !== claims.role
      ) {
        throw new UnauthorizedException('Authentication token is invalid');
      }
      request.user = claims;
      return true;
    } catch {
      throw new UnauthorizedException('Authentication token is invalid');
    }
  }
}
