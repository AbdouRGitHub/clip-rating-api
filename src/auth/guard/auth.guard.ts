import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from 'src/user/entities/user.entity';
import { AuthService } from '../auth.service';

const matchRoles = (roles: string[], userRole: string) => {
  const match = roles.some((role) => role === userRole);
  if (!match) {
    throw new UnauthorizedException('ROLE_NOT_MATCH');
  }
  return true;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    //get the roles from the decorator
    const roles: string[] = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!roles) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();

    //check if the user session exists
    if (!request.session.userId) {
      throw new UnauthorizedException('SESSION_NOT_FOUND');
    }

    //get the user from the session
    const userRole: UserRole = await this.authService.getUserRole(request);

    //check if the user has the right role
    return matchRoles(roles, userRole);
  }
}
