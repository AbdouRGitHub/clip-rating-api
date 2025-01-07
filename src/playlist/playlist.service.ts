import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { Playlist } from './entities/playlist.entity';
import { FindManyOptions, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from './dto/pagination.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
  ) {}

  async create(
    createPlaylistDto: CreatePlaylistDto,
    request: Request,
  ): Promise<Playlist> {
    const { userId } = request.session;

    const playlist = this.playlistRepository.create({
      ...createPlaylistDto,
      user: { id: userId },
    });

    try {
      await this.playlistRepository.save(playlist);
      return;
    } catch {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getMyPlaylists(
    paginationDto: PaginationDto,
    request: Request,
  ): Promise<[Playlist[], number]> {
    const { userId } = request.session;
    const { page, limit, search } = paginationDto;

    const findOptions: FindManyOptions<Playlist> = {
      where: {
        user: { id: userId },
      },
      relations: ['sender'],
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    };

    if (search) {
      findOptions.where = {
        ...findOptions.where,
        name: Like(`%${search}%`),
      };
    }

    try {
      return await this.playlistRepository.findAndCount(findOptions);
    } catch {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getUserPlaylists(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<[Playlist[], number]> {
    const { page, limit, search } = paginationDto;

    const findOptions: FindManyOptions<Playlist> = {
      where: {
        user: { id: userId },
      },
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    };

    if (search) {
      findOptions.where = {
        ...findOptions.where,
        name: Like(`%${search}%`),
      };
    }

    try {
      return await this.playlistRepository.findAndCount(findOptions);
    } catch {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async updatePlaylist(
    playlistId: string,
    updatePlaylistDto: UpdatePlaylistDto,
    request: Request,
  ) {
    const { userId } = request.session;
    const playlist = await this.playlistRepository.preload({
      id: playlistId,
      ...updatePlaylistDto,
      user: { id: userId },
    });

    if (!playlist) {
      throw new BadRequestException('Playlist not found or no permission');
    }

    try {
      await this.playlistRepository.save(playlist);
      return;
    } catch {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async likePlaylist(playlistId: string, request: Request) {
    const { userId } = request.session;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (
      user.likedPlaylists.some(
        (likedPlaylist) => likedPlaylist.id === playlist.id,
      )
    ) {
      throw new NotFoundException('User has already liked this playlist');
    }
    user.likedPlaylists.push(playlist);

    try {
      await this.userRepository.save(user);
      return;
    } catch {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async unlikePlaylist(playlistId: string, request: Request) {
    const { userId } = request.session;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (
      !user.likedPlaylists.some(
        (likedPlaylist) => likedPlaylist.id === playlist.id,
      )
    ) {
      throw new NotFoundException('User has not liked this playlist');
    }

    user.likedPlaylists = user.likedPlaylists.filter(
      (likedPlaylist) => likedPlaylist.id !== playlist.id,
    );

    try {
      await this.userRepository.save(user);
      return;
    } catch {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async deletePlaylist(playlistId: string, request: Request) {
    const { userId } = request.session;

    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId, user: { id: userId } },
    });

    if (!playlist) {
      throw new BadRequestException('Playlist not found or no permission');
    }

    try {
      await this.playlistRepository.remove(playlist);
      return;
    } catch {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
