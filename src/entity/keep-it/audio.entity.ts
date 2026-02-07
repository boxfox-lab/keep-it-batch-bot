import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NoteEntity } from './note.entity';

@Entity('audio')
export class AudioEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @ManyToOne(() => NoteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'note_id' })
  note: NoteEntity;

  @Column({ name: 'ai_summary', nullable: true })
  aiSummary: string;

  @Column({ type: 'json', nullable: true, default: '[]' })
  qa: { question: string; answer: string }[];

  @Column({ name: 'local_id', nullable: true, unique: true })
  localId: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;
}
