import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseArrayPipe,
  Req,
  UploadedFiles,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { ClipService } from './clip.service';
import { CreateClipDto } from './dto/create-clip.dto';
import { UpdateClipDto } from './dto/update-clip.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import { ClipPaginationDto } from './dto/pagination.dto';

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
  findAll(@Param('playlistId') playlistId: string) {
    return this.clipService.findAll(playlistId);
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
