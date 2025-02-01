import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { Request } from 'express';
import { UserRole } from 'src/user/entities/user.entity';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { Playlist } from './entities/playlist.entity';
import { PaginationDto } from './dto/pagination.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  @Roles([UserRole.USER])
  create(
    @Body() createPlaylistDto: CreatePlaylistDto,
    @Req() request: Request,
  ): Promise<Playlist> {
    return this.playlistService.create(createPlaylistDto, request);
  }

  @Get()
  @Roles([UserRole.USER])
  findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<[Playlist[], number]> {
    return this.playlistService.findAll(paginationDto);
  }

  @Get(':id')
  @Roles([UserRole.USER])
  findOne(@Param('id') playlistId: string): Promise<Playlist> {
    return this.playlistService.findOne(playlistId);
  }

  @Patch(':id')
  @Roles([UserRole.USER])
  @HttpCode(204)
  update(
    @Param('id') playlistId: string,
    @Body() updatePlaylistDto: UpdatePlaylistDto,
    @Req() request: Request,
  ): Promise<void> {
    return this.playlistService.update(
      playlistId,
      updatePlaylistDto,
      request,
    );
  }

  @Delete(':id')
  @Roles([UserRole.USER])
  remove(@Param('id') playlistId: string, @Req() request: Request) {
    return this.playlistService.remove(playlistId, request);
  }
}
