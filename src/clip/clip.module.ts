import { Module } from '@nestjs/common';
import { ClipService } from './clip.service';
import { ClipController } from './clip.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clip } from './entities/clip.entity';
import { Playlist } from 'src/playlist/entities/playlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clip, Playlist])],
  controllers: [ClipController],
  providers: [ClipService],
})
export class ClipModule {}
