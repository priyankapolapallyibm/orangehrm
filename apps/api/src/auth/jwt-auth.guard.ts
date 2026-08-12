import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtUser {
  sub: number;
  username: string;
  role: string;
}

type AuthenticatedRequest = Request & { user?: JwtUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Authentication is required');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtUser>(token);
      return true;
    } catch {
      throw new UnauthorizedException('Authentication token is invalid');
    }
  }
}
