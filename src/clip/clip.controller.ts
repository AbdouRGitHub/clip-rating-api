import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ClipService } from './clip.service';
import { CreateClipDto } from './dto/create-clip.dto';
import { UpdateClipDto } from './dto/update-clip.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

@Controller('playlist/:playlistId/clip')
export class ClipController {
  constructor(private readonly clipService: ClipService) {}

  @Post()
  @Roles([UserRole.USER])
  @UseInterceptors(FileInterceptor('video'))
  create(
    @Param('playlistId') playlistId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(mp4|mov|avi)' }),
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 100 }), // 100MB max
        ],
      }),
    )
    video: Express.Multer.File,
    @Body()
    createClipDto: CreateClipDto,
    @Req() request: Request,
  ) {
    return this.clipService.create(playlistId, createClipDto, video, request);
  }

  @Get()
  getPlaylistClips(@Param('playlistId') playlistId: string) {
    console.log('playlistId');
    return this.clipService.getPlaylistClips(playlistId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clipService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClipDto: UpdateClipDto) {
    return this.clipService.update(+id, updateClipDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clipService.remove(+id);
  }
}
