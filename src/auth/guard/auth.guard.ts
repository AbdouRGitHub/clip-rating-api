import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    const user: User = await this.userRepository.findOne({
      where: { id: request.session.userId },
      select: ['id', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    //check if the user has the right role
    return matchRoles(roles, user.role);
  }
}
