import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FolderEntity } from './folder.entity';
import { FolderHistoryType } from '../../models/FolderHistoryType';

@Entity('folder_history')
export class FolderHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: FolderHistoryType,
  })
  type: FolderHistoryType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => FolderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: FolderEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uid' })
  user: UserEntity;
}
