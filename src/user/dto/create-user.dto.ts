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

  @IsStrongPassword({ minLength: 7, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
  @IsNotEmpty()
  password: string;

  @IsString()
  confirmPassword: string;
}
