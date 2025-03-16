import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserRole } from 'src/user/entities/user.entity';
import { Request, Response } from 'express';
import { AuthDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async login(authDto: AuthDto, request: Request): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        email: authDto.email,
      },
      select: ['id', 'email', 'password'],
    });

    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const isPasswordMatch: boolean = await bcrypt.compare(
      authDto.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    request.session.userId = user.id;
    return;
  }

  async logout(request: Request, response: Response): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        request.session.destroy((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      response.clearCookie('session_nest');
      response.sendStatus(204);
    } catch {
      response.status(500);
    }
  }

  async getUserRole(request: Request): Promise<UserRole> {
    const { userId } = request.session;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    return user.role;
  }

  async authInfo(request: Request): Promise<User> {
    const { userId } = request.session;
    return await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'username'],
    });
  }
}
