import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('notify')
export class NotifyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uid' })
  user: UserEntity;

  @Column()
  time: Date;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ nullable: true })
  url: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'is_sent', default: false })
  isSent?: boolean;

  @Column({ default: false })
  tag: string;
}
