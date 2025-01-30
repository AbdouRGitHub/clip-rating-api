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
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.playlists)
  user: User;

  @ManyToMany(() => User, (user) => user.likedPlaylists)
  likedBy: User[];

  @OneToMany(() => Clip, (clip) => clip.playlist)
  clips: Clip[];
}
