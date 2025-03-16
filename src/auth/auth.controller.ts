import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  Session,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

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

  @Get('check-session')
  checkSession(@Session() session: Record<string, any>)  {
    if (!session || !session.userId) {
      return false
    }
    return true;
  }

  @Get('info')
  async authInfo(@Req() request: Request) {
    return await this.authService.authInfo(request);
  }
}
