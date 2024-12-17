import { BadRequestException, Injectable, Req, Res } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { Request, Response } from 'express';
import { AuthDto } from './dto/auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRespository: Repository<User>,
  ) {}

  async login(authDto: AuthDto, @Req() request: Request) {
    const user = await this.userRespository.findOne({
      where: {
        email: authDto.email,
      },
      select: ['id', 'email', 'password', 'role'],
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordMatch: boolean = await bcrypt.compare(
      authDto.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    request.session.userId = user.id;
    request.session.role = user.role;
    return 'Login successful';
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
      response.sendStatus(204);
    } catch (error) {
      response.status(500);
    }
  }

  async profile(@Req() request: Request) {
    return await this.userRespository.findOne({
      where: {
        id: request.session.userId,
      },
    });
  }
}
