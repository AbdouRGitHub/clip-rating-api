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
import { Roles } from 'src/auth/decorator/roles.decorator';
import { UserRole } from 'src/user/entities/user.entity';

@Controller('relationship')
export class RelationshipController {
  constructor(private relationshipService: RelationshipService) {}

  @Post('friend-request')
  @Roles([UserRole.USER])
  sendFriendRequest(
    @Body('receiverId') receiverId: string,
    @Req() request: Request,
  ) {
    return this.relationshipService.sendFriendRequest(receiverId, request);
  }

  @Get('friend-requests')
  @Roles([UserRole.USER])
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
  @Roles([UserRole.USER])
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
  @Roles([UserRole.USER])
  getFriendRequest(
    @Param('id') friendRequestId: string,
    @Req() request: Request,
  ) {
    return this.relationshipService.getFriendRequest(friendRequestId, request);
  }

  @Patch('friend-request/:id/accept')
  @Roles([UserRole.USER])
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
  @Roles([UserRole.USER])
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
  @Roles([UserRole.USER])
  blockUser(@Body('receiverId') receiverId: string, @Req() request: Request) {
    return this.relationshipService.blockUser(receiverId, request);
  }
}
