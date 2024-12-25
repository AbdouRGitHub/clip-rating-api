import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
