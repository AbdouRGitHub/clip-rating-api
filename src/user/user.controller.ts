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
import { User, UserRole } from './entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { PaginationDto } from './dto/pagination.dto';
import { Roles } from 'src/auth/decorator/roles.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles([UserRole.USER])
  findAll(
    @Query() paginationDto: PaginationDto,
    @Req() request: Request,
  ): Promise<[User[], number]> {
    return this.userService.findAll(paginationDto, request);
  }

  @Get(':id')
  @Roles([UserRole.USER])
  findOne(@Param('id') id: string, @Req() request: Request): Promise<User> {
    return this.userService.findOne(id, request);
  }

  @Patch()
  @HttpCode(204)
  @Roles([UserRole.USER])
  update(@Body() updateUserDto: UpdateUserDto, @Req() request: Request) {
    return this.userService.update(updateUserDto, request);
  }

  @Patch('password')
  @HttpCode(204)
  @Roles([UserRole.USER])
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() request: Request,
  ) {
    return this.userService.updatePassword(updatePasswordDto, request);
  }

  @Get('profile')
  @Roles([UserRole.USER, UserRole.ADMIN])
  profile(@Req() request: Request): Promise<User> {
    return this.userService.profile(request);
  }

  @Delete()
  @HttpCode(204)
  @Roles([UserRole.USER])
  remove(@Req() request: Request) {
    return this.userService.remove(request);
  }
}
