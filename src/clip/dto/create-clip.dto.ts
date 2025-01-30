import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class CreateClipDto {
  @IsNumber()
  @IsNotEmpty()
  videoIndex: number;

  @IsString()
  @IsNotEmpty()
  title: string;

}

export class CreateClipsDto {
  @ValidateNested({ each: true })
  @Type(() => CreateClipDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  clips: CreateClipDto[];
}
