import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClipDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}
