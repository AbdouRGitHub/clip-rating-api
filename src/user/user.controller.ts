import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  HttpCode,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request } from 'express';
import { User } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginationDto } from './dto/pagination.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Req() request: Request,
  ): Promise<[User[], number]> {
    return this.userService.findAll(paginationDto, request);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request): Promise<User> {
    return this.userService.findOne(id, request);
  }

  @Patch()
  @HttpCode(204)
  update(@Body() updateUserDto: UpdateUserDto, @Req() request: Request) {
    return this.userService.update(updateUserDto, request);
  }

  @Patch('password')
  @HttpCode(204)
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request,
  ) {
    return this.userService.updatePassword(updatePasswordDto, request);
  }

  @Delete()
  @HttpCode(204)
  remove(@Req() request: Request) {
    return this.userService.remove(request);
  }
}
