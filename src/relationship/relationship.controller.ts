import {
  Body,
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
import { PaginationDto } from './dto/pagination.dto';

@Controller('relationship')
export class RelationshipController {
  constructor(private relationshipService: RelationshipService) {}

  @Post('friend-request')
  sendFriendRequest(
    @Body('receiverId') receiverId: string,
    @Req() request: Request,
  ) {
    return this.relationshipService.sendFriendRequest(receiverId, request);
  }

  @Get('friend-requests')
  getFriendRequests(
    @Query() friendPaginationDto: PaginationDto,
    @Req() request: Request,
  ) {
    return this.relationshipService.getFriendRequests(
      friendPaginationDto,
      request,
    );
  }

  @Get('friend-requests/sent')
  getSentFriendRequests(
    @Query() friendPaginationDto: PaginationDto,
    @Req() request: Request,
  ) {
    return this.relationshipService.getSentFriendRequests(
      friendPaginationDto,
      request,
    );
  }

  @Get('friend-request/:id')
  getFriendRequest(
    @Param('id') friendRequestId: string,
    @Req() request: Request,
  ) {
    return this.relationshipService.getFriendRequest(friendRequestId, request);
  }

  @Patch('friend-request/:id/accept')
  acceptFriendRequest(
    @Param('id') friendRequestId: string,
    @Req() request: Request,
  ) {
    return this.relationshipService.acceptFriendRequest(
      friendRequestId,
      request,
    );
  }

  @Delete('friend-request/:id/reject')
  rejectFriendRequest(
    @Param('id') friendRequestId: string,
    @Req() request: Request,
  ) {
    return this.relationshipService.rejectFriendRequest(
      friendRequestId,
      request,
    );
  }

  @Patch(':id')
  blockUser(@Body('receiverId') receiverId: string, @Req() request: Request) {
    return this.relationshipService.blockUser(receiverId, request);
  }
}
