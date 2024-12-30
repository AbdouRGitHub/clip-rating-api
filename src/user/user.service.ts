import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { In, Not, Repository } from 'typeorm';
import { Request } from 'express';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user: User = await this.userRepository.create(createUserDto);

    //check if the password and confirmPassword match
    if (createUserDto.password !== createUserDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    //check if the email already exists
    const emailExists: boolean = await this.userRepository.existsBy({
      email: user.email,
    });
    if (emailExists) {
      throw new BadRequestException('Email already exists');
    }
    //check if the username already exists
    const usernameExists: boolean = await this.userRepository.existsBy({
      username: user.username,
    });
    if (usernameExists) {
      throw new BadRequestException('Username already exists');
    }

    try {
      const userCreated = await this.userRepository.save(user);
      delete userCreated.password;
      return await userCreated;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    request: Request,
  ): Promise<[User[], number]> {
    const { page, limit } = paginationDto;
    try {
      return await this.userRepository.findAndCount({
        where: { id: Not(request.session.userId) },
        take: limit,
        skip: (page - 1) * limit,
        order: { createdAt: 'DESC' },
      });
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async findOne(id: string, request: Request): Promise<User> {
    try {
      return await this.userRepository.findOneBy({ id });
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async update(updateUserDto: UpdateUserDto, request: Request) {
    const { userId } = request.session;
    const user = await this.userRepository.preload({
      id: userId,
      ...updateUserDto,
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    try {
      await this.userRepository.save(user);
      return;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto, request: Request) {
    const { userId } = request.session;
    const { newPassword, oldPassword, newPasswordConfirm } = updatePasswordDto;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (await bcrypt.compare(oldPassword, user.password)) {
      throw new BadRequestException('Old password is incorrect');
    }

    if (newPassword !== newPasswordConfirm) {
      throw new BadRequestException('Passwords do not match');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    try {
      user.password = newPasswordHash;
      await this.userRepository.save(user);
      return;
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async profile(request: Request): Promise<User> {
    const { userId } = request.session;
    return await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
  }
  
  async remove(@Req() request: Request) {
    const { userId } = request.session;

    const user = await this.userRepository.existsBy({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    try {
      await this.userRepository.delete({ id: userId });
      return;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
