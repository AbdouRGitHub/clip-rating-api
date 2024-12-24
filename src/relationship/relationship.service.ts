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
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectRepository(Relationship)
    private relationshipRepository: Repository<Relationship>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendFriendRequest(receiverId: string, request: Request) {
    const { userId } = request.session;
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
        { sender: { id: userId }, receiver: receiver },
        { sender: receiver, receiver: { id: userId } },
      ],
    });

    if (relationExists) {
      throw new BadRequestException(
        'Relationship already exists (pending, accepted, or blocked)',
      );
    }

    const friendRequest: Relationship =
      await this.relationshipRepository.create({
        sender: { id: userId },
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

  async getFriendRequests(paginationDto: PaginationDto, request: Request) {
    const { userId } = request.session;
    const { page, limit, search } = paginationDto;

    const findOptions: FindManyOptions<Relationship> = {
      where: {
        receiver: { id: userId },
        status: RelationshipStatus.FRIEND_REQUEST,
      },
      select: ['id', 'createdAt'],
      relations: ['sender'],
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
      throw new InternalServerErrorException('An unexpected error occurred: ');
    }
  }

  async getSentFriendRequests(paginationDto: PaginationDto, request: Request) {
    const { userId } = request.session;
    const { page, limit, search } = paginationDto;

    const findOptions: FindManyOptions<Relationship> = {
      where: {
        sender: { id: userId },
        status: RelationshipStatus.FRIEND_REQUEST,
      },
      select: ['id', 'createdAt'],
      relations: ['receiver'],
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
      throw new InternalServerErrorException('An unexpected error occurred: ');
    }
  }

  async getFriendRequest(friendRequestId: string, request: Request) {
    const { userId } = request.session;

    const friendRequest: Relationship =
      await this.relationshipRepository.findOne({
        where: {
          id: friendRequestId,
          receiver: { id: userId },
          status: RelationshipStatus.FRIEND_REQUEST,
        },
        relations: ['sender'],
      });

    return await friendRequest;
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
      return;
    } catch (err) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async getFriends(paginationDto: PaginationDto, request: Request) {
    const { userId } = request.session;
    const { page, limit, search } = paginationDto;
    const findOptions: FindManyOptions<Relationship> = {
      where: {
        receiver: { id: userId },
        status: RelationshipStatus.FRIEND,
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
}
