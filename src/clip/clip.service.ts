import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateClipDto } from './dto/create-clip.dto';
import { UpdateClipDto } from './dto/update-clip.dto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Clip } from './entities/clip.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { query, Request } from 'express';
import { Playlist } from 'src/playlist/entities/playlist.entity';

@Injectable()
export class ClipService {
  private supabase: SupabaseClient;
  constructor(
    private dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
    @InjectRepository(Clip)
    private readonly clipRepository: Repository<Clip>,
  ) {
    this.supabase = createClient(
      this.configService.get('SUPABASE_URL'),
      this.configService.get('SUPABASE_KEY'),
    );
  }
  async create(
    playlistId: string,
    createClipDto: CreateClipDto,
    video: Express.Multer.File,
    request: Request,
  ) {
    const { userId } = request.session;
    let videoFullPath: string = '';

    const playlist: Playlist = await this.playlistRepository.findOne({
      relations: ['user'],
      where: {
        id: playlistId,
      },
      select: {
        id: true,
        user: {
          id: true,
        },
      },
    });

    if (!playlist) {
      throw new ForbiddenException('Playlist not found');
    }

    if (playlist.user.id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add clips to this playlist',
      );
    }

    const clip = this.clipRepository.create({
      ...createClipDto,
      playlist: { id: playlistId },
    });

    try {
      const { data, error } = await this.supabase.storage
        .from(this.configService.get('SUPABASE_CLIP_BUCKET'))
        .upload(`${playlist.id}/${video.originalname}`, video.buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: video.mimetype,
        });
      if (error) {
        throw new Error(`Upload file error : ${error.message}`);
      }
      videoFullPath = data.fullPath;
      clip.path = data.path;
      await this.clipRepository.save(clip);
    } catch (error) {
      if (videoFullPath) {
        await this.supabase.storage
          .from(this.configService.get('SUPABASE_CLIP_BUCKET'))
          .remove([videoFullPath]);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }

    return;
  }

  findAll(playlistId: string) {
    return this.playlistRepository.findBy({
      id: playlistId,
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} clip`;
  }

  update(id: number, updateClipDto: UpdateClipDto) {
    return `This action updates a #${id} clip`;
  }

  remove(id: number) {
    return `This action removes a #${id} clip`;
  }
}
