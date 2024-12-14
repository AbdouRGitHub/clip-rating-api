import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,

} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(6, 20)
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword({ minLength: 7 })
  @IsNotEmpty()
  password: string;
}
