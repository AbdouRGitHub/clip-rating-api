import { BadRequestException, Injectable, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    let user: User = await this.userRepository.create(createUserDto);

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
      let userCreated = await this.userRepository.save(user);
      delete userCreated.password;
      return await userCreated;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAll(@Req() request: Request): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: string, @Req() request: Request): Promise<User> {
    return await this.userRepository.findOneBy({ id });
  }

  async update(updateUserDto: UpdateUserDto, @Req() request: Request) {
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
    } catch {
      throw new BadRequestException('Error updating user');
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
      throw new BadRequestException(err);
    }
  }
}
