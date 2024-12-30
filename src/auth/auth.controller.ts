import { Body, Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { Roles } from './decorator/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() authDto: AuthDto, @Req() request: Request) {
    return await this.authService.login(authDto, request);
  }

  @Delete('logout')
  async logout(@Req() request: Request, @Res() response: Response) {
    return await this.authService.logout(request, response);
  }
}
