import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NoteEntity } from './note.entity';

@Entity('image')
export class ImageEntity {
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

  @Column({ default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ name: 'local_id', nullable: true, unique: true })
  localId: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;
}
