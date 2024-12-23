import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RelationshipService } from './relationship.service';
import { FriendPaginationDto } from './dto/friend-pagination.dto';

@Controller('friend')
export class RelationshipController {
  constructor(private relationshipService: RelationshipService) {}

  @Post(':id')
  sendFriendRequest(@Param('id') receiverId: string, @Req() request: Request) {
    return this.relationshipService.sendFriendRequest(receiverId, request);
  }

  @Get()
  getFriendRequests(@Query() friendPaginationDto: FriendPaginationDto, @Req() request: Request) {}

  @Get(':id')
  getFriendRequest(@Param('id') friendRequestId: string, @Req() request: Request) {}

  @Patch(':id/accept')
  acceptFriendRequest(@Param('id') friendRequestId: string, @Req() request: Request) {}

  @Delete('id/reject')
  rejectFriendRequest(@Param('id') friendRequestId: string, @Req() request: Request) {}

  @Patch(':id/block')
  blockUser(@Param('id') receiverId: string, @Req() request: Request) {}
}
