import { BadRequestException, Injectable, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Request } from 'express';

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

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number, @Req() request: Request) {
    return `This action removes a #${id} user`;
  }
}
