import { Clip } from 'src/clip/entities/clip.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';

@Entity()
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ select: false })
  readonly createdAt: Date;

  @UpdateDateColumn({ select: false })
  readonly updatedAt: Date;

  @ManyToMany(() => User, (user) => user.likedPlaylists)
  @JoinTable({ name: 'playlistLikes' })
  likedBy: User[];

  @ManyToOne(() => User, (user) => user.playlists)
  @JoinColumn({ name: 'ownerId' })
  user: User;

  @OneToMany(() => Clip, (clip) => clip.playlist)
  clips: Clip[];
}
