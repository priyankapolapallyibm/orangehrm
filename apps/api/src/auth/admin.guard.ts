import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

type RoleRequest = Request & { user?: { role?: string } };

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RoleRequest>();

    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Administrator access is required');
    }

    return true;
  }
}
