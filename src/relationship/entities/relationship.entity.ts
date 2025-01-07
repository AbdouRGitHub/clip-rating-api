import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RelationshipStatus {
  FRIEND_REQUEST = 'friend_request',
  FRIEND = 'friend',
  BLOCKED = 'blocked',
}

@Entity()
export class Relationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: RelationshipStatus,
    default: RelationshipStatus.FRIEND_REQUEST,
  })
  status: RelationshipStatus;

  @ManyToOne(() => User, (user) => user.initiatedRelationships)
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedRelationships)
  receiver: User;

  @CreateDateColumn({ select: false })
  readonly createdAt: Date;

  @UpdateDateColumn({ select: false })
  readonly updatedAt: Date;
}
