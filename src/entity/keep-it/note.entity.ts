import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AudioEntity } from './audio.entity';
import { FolderEntity } from './folder.entity';
import { ImageEntity } from './image.entity';

@Entity('note')
export class NoteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uid' })
  user: UserEntity;

  @Column({ type: 'json', default: '[]' })
  urls: string[];

  @Column({ nullable: true })
  content: string;

  @Column({ type: 'json', default: '[]' })
  tags: string[];

  @ManyToOne(() => FolderEntity, { nullable: true })
  @JoinColumn({ name: 'folder_id' })
  folder: FolderEntity;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'ai_summary', nullable: true })
  aiSummary: string;

  @OneToMany(() => AudioEntity, (audio) => audio.note)
  @JoinColumn()
  audioList: AudioEntity[];

  @OneToMany(() => ImageEntity, (image) => image.note)
  @JoinColumn({ name: 'images' })
  images: ImageEntity[];

  @Column({ name: 'date' })
  date: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'json', nullable: true, default: '[]' })
  qa: { question: string; answer: string }[];

  @Column({ default: 'en' })
  lang: string;

  @Column({ name: 'local_id', nullable: true, unique: true })
  localId: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;
}
