import { Module } from '@nestjs/common';
import { RelationshipController } from './relationship.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Relationship } from './entities/relationship.entity';
import { RelationshipService } from './relationship.service';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Relationship, User])],
  controllers: [RelationshipController],
  providers: [RelationshipService],
})
export class RelationshipModule {}
