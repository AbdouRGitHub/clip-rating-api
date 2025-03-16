import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CreateClipDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
