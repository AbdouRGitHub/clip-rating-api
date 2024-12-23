import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Relationship } from 'src/relationship/entities/relationship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Relationship])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
