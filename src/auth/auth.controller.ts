import { Body, Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { Roles } from './decorator/roles.decorator';

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

  @Roles(['user', 'admin'])
  @Get('profile')
  async profile(@Req() request: Request) {
    return await this.authService.profile(request);
  }
}
