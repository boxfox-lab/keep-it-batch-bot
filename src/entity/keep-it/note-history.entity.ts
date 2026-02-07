import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { NoteEntity } from './note.entity';
import { NoteHistoryType } from '../../models/NoteHistoryType';

@Entity('note_history')
export class NoteHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NoteHistoryType,
  })
  type: NoteHistoryType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => NoteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note: NoteEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uid' })
  user: UserEntity;
}
