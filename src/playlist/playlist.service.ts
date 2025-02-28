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

  async findAll(paginationDto: PaginationDto): Promise<{
    data: Playlist[];
    total: number;
    page: number;
    lastPage: number;
}> {
    const { page, limit } = paginationDto;

    try {
      const [playlists, total]: [Playlist[], number] =
        await this.playlistRepository
          .createQueryBuilder('playlist')
          .leftJoinAndSelect('playlist.user', 'user')
          .leftJoinAndSelect('playlist.likedBy', 'likedBy')
          .loadRelationCountAndMap('playlist.likesCount', 'playlist.likedBy')
          .take(limit)
          .skip((page - 1) * limit)
          .orderBy('playlist.createdAt', 'DESC')
          .getManyAndCount();

      return {
        data: playlists,
        total: total,
        page: page,
        lastPage: Math.ceil(total / limit),
      };
    } catch {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async findOne(playlistId: string): Promise<Playlist> {
    try {
      return await this.playlistRepository.findOneBy({ id: playlistId });
    } catch (err) {
      throw new InternalServerErrorException(`An unexpected error occurred`);
    }
  }

  async toggleLike(playlistId: string, request: Request): Promise<string> {
    const { userId } = request.session;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['likedPlaylists'],
    });
    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId },
      relations: ['likedBy'],
    });

    if (!user || !playlist) throw new Error('User or Playlist not found');

    const alreadyLiked = user.likedPlaylists.some((p) => p.id === playlistId);

    if (alreadyLiked) {
      user.likedPlaylists = user.likedPlaylists.filter(
        (p) => p.id !== playlistId,
      );
      await this.userRepository.save(user);
      return 'Like removed';
    } else {
      user.likedPlaylists.push(playlist);
      await this.userRepository.save(user);
      return 'Playlist liked';
    }
  }

  async update(
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

  async remove(playlistId: string, request: Request) {
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
