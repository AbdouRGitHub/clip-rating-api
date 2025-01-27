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
import { DataSource, In, Not, QueryRunner, Repository } from 'typeorm';
import { Request } from 'express';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto } from './dto/pagination.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private supabase: SupabaseClient;
  constructor(
    private dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_KEY'),
    );
  }

  async create(
    createUserDto: CreateUserDto,
    avatar: Express.Multer.File,
  ): Promise<User> {
    const queryRunner: QueryRunner = await this.dataSource.createQueryRunner();
    const user: User = await this.userRepository.create(createUserDto);
    let avatarFullPath: string;

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

    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const userCreated: User = await queryRunner.manager.save(User, user);
      if (avatar) {
        const { data, error } = await this.supabase.storage
          .from(this.configService.get('SUPABASE_AVATAR_BUCKET'))
          .upload(`${userCreated.id}/avatar1.png`, avatar.buffer, {
            cacheControl: '3600',
            upsert: false,
            contentType: avatar.mimetype,
          });
        if (error) {
          throw new Error(`Upload file error : ${error.message}`);
        }
        avatarFullPath = data.fullPath;
        userCreated.avatar_path = data.path;
      }

      await queryRunner.manager.save(User, userCreated);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (avatarFullPath) {
        await this.supabase.storage
          .from(this.configService.get('SUPABASE_AVATAR_BUCKET'))
          .remove([avatarFullPath]);
      }
      throw new InternalServerErrorException(error.message);
    } finally {
      await queryRunner.release();
    }
    return;
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
    const queryRunner: QueryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const user: User = await queryRunner.manager.findOneBy(User, {
      id: userId,
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await queryRunner.startTransaction();
    try {
      if (user.avatar_path) {
        const { error } = await this.supabase.storage
          .from(this.configService.get('SUPABASE_AVATAR_BUCKET'))
          .remove([user.avatar_path]);

        if (error) {
          throw new Error(`Upload file error : ${error.message}`);
        }
      }
      await queryRunner.manager.delete(User, { id: userId });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();

      //GESTION DU ROLLBACK DU LA PHOTO DE PROFIL SUPABASE
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
    return;
  }
}
