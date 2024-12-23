import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Relationship,
  RelationshipStatus,
} from './entities/relationship.entity';
import { FindManyOptions, Like, Not, Repository } from 'typeorm';
import { Request } from 'express';
import { User } from 'src/user/entities/user.entity';
import { FriendPaginationDto } from './dto/friend-pagination.dto';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectRepository(Relationship)
    private relationshipRepository: Repository<Relationship>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendFriendRequest(receiverId: string, request: Request) {
    //Check if the sender exists
    const sender: User = await this.userRepository.findOne({
      where: { id: request.session.userId },
      select: ['id'],
    });

    if (!sender) {
      throw new BadRequestException('Sender not found');
    }

    // Check if the reciever exists
    const receiver: User = await this.userRepository.findOne({
      where: { id: receiverId },
      select: ['id'],
    });

    if (!receiver) {
      throw new BadRequestException('Receiver not found');
    }

    // Check if the recieverId is the same as the senderId
    if (receiverId === request.session.userId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    // Check if the relationship already exists
    const relationExists: boolean = await this.relationshipRepository.exists({
      where: [
        { sender: sender, receiver: receiver },
        { sender: receiver, receiver: sender },
      ],
    });

    if (relationExists) {
      throw new BadRequestException(
        'Relationship already exists (pending, accepted, or blocked)',
      );
    }

    const friendRequest: Relationship =
      await this.relationshipRepository.create({
        sender: sender,
        receiver: receiver,
        status: RelationshipStatus.FRIEND_REQUEST,
      });

    try {
      await this.relationshipRepository.save(friendRequest);
      return;
    } catch (err) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getFriendRequests(
    friendpaginationDto: FriendPaginationDto,
    request: Request,
  ) {
    const { page, limit, search } = friendpaginationDto;
    const findOptions: FindManyOptions<Relationship> = {
      where: {
        receiver: { id: request.session.userId },
        status: RelationshipStatus.FRIEND_REQUEST,
      },
      relations: ['sender', 'receiver'],
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    };

    if (search) {
      findOptions.where = {
        ...findOptions.where,
        sender: { username: Like(`%${search}%`) },
      };
    }

    try {
      return await this.relationshipRepository.findAndCount(findOptions);
    } catch (err) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getFriendRequest(friendRequestId: string, request: Request) {
    const { userId } = request.session;

    if (!friendRequestId) {
      throw new BadRequestException('Friend request not found');
    }
    try {
      return await this.relationshipRepository.findOne({
        where: {
          id: friendRequestId,
          receiver: { id: userId },
          status: RelationshipStatus.FRIEND_REQUEST,
        },
        relations: ['sender', 'receiver'],
      });
    } catch (err) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async acceptFriendRequest(friendRequestId: string, request: Request) {
    const { userId } = request.session;
    const friendRequest: Relationship =
      await this.relationshipRepository.findOne({
        where: {
          id: friendRequestId,
          receiver: { id: userId },
          status: RelationshipStatus.FRIEND_REQUEST,
        },
      });

    if (!friendRequest) {
      throw new BadRequestException('Friend request not found');
    }

    friendRequest.status = RelationshipStatus.FRIEND;
    try {
      await this.relationshipRepository.save(friendRequest);
      return;
    } catch (err) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async rejectFriendRequest(friendRequestId: string, request: Request) {
    const { userId } = request.session;
    const friendRequest: Relationship =
      await this.relationshipRepository.findOne({
        where: {
          id: friendRequestId,
          receiver: { id: userId },
          status: RelationshipStatus.FRIEND_REQUEST,
        },
      });

    if (!friendRequest) {
      throw new BadRequestException('Friend request not found');
    }

    try {
      await this.relationshipRepository.remove(friendRequest);
      return;
    } catch (err) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async blockUser(receiverId: string, request: Request) {
    const { userId } = request.session;

    //check if the receiver is the same as the sender
    if (receiverId === userId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const reciever: boolean = await this.userRepository.existsBy({
      id: receiverId,
    });
    if (!reciever) {
      throw new BadRequestException('User not found');
    }

    //check if the receiver is already blocked
    const blocked: boolean = await this.relationshipRepository.exists({
      where: {
        sender: { id: userId },
        receiver: { id: receiverId },
        status: RelationshipStatus.BLOCKED,
      },
    });

    if (blocked) {
      throw new BadRequestException('User already blocked');
    }

    const undesiredRelationships: Relationship[] =
      await this.relationshipRepository.find({
        where: [
          {
            sender: { id: userId },
            receiver: { id: receiverId },
          },
          {
            sender: { id: receiverId },
            receiver: { id: userId },
            status: Not(RelationshipStatus.BLOCKED),
          },
        ],
      });

    try {
      await this.relationshipRepository.remove(undesiredRelationships);
      return await this.relationshipRepository.save({
        sender: { id: userId },
        receiver: { id: receiverId },
        status: RelationshipStatus.BLOCKED,
      });
    } catch (err) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
