import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Relationship } from 'src/relationship/entities/relationship.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    select: false,
  })
  role: UserRole;

  @CreateDateColumn({ select: false })
  readonly createdAt: Date;

  @UpdateDateColumn({ select: false })
  readonly updatedAt: Date;

  @OneToMany(() => Relationship, (relation) => relation.sender)
  initiatedRelationships: Relationship[];

  @OneToMany(() => Relationship, (relation) => relation.receiver)
  receivedRelationships: Relationship[];

  @BeforeInsert()
  private async hashPassword(): Promise<void> {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
}
