import { Injectable, Req, Res } from '@nestjs/common';
import { User, UserRole } from 'src/user/entities/user.entity';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  private users: User[] = [
    {
      id: 'fazdapzidjaojdaz',
      email: 'test@gmail.com',
      username: 'test',
      password: 'test',
      role: UserRole.USER,
      createdAt: undefined,
      updatedAt: undefined,
    },
    {
      id: 'fazdapzidjaojdaz',
      email: 'admin@gmail.com',
      username: 'admin',
      password: 'admin',
      role: UserRole.ADMIN,
      createdAt: undefined,
      updatedAt: undefined,
    },
  ];

  constructor() {}

  async login(email: string, password: string, @Req() request: Request) {
    const user = this.users.find(
      (user) => user.email === email && user.password === password,
    );
    if (user) {
      request.session.userId = user.id;
      request.session.role = user.role;
      return { message: 'Login success', sessionId: request.session.userId };
    } else {
      throw new Error('User not found');
    }
  }

  async logout(@Req() request: Request, @Res() response: Response) {
    try {
      await new Promise<void>((resolve, reject) => {
        request.session.destroy((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      response.clearCookie('session_nest');
      response.sendStatus(200);
    } catch (error) {
      console.error('Failed to logout:', error);
      response.status(500).send({ message: 'Logout failed', error });
    }
  }

  async profile(@Req() request: Request) {
    return await this.users.find((user) => user.id === request.session.userId);
  }

}
