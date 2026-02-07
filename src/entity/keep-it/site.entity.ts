import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('site')
export class SiteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  lang: string;

  @Column({ nullable: true, name: 'title' })
  title: string;

  @Column({ nullable: true, name: 'site_name' })
  siteName: string;

  @Column({ nullable: true, name: 'description' })
  description: string;

  @Column({ nullable: true, name: 'html' })
  html: string;

  @Column({ nullable: true, name: 'thumbnail' })
  thumbnail: string;

  @Column({ nullable: true, name: 'summary' })
  summary: string;

  @Column({ nullable: true, name: 'main_points', type: 'json', default: '[]' })
  mainPoints: string[];

  @Column({ nullable: true, name: 'qa', type: 'json', default: '[]' })
  qa: { question: string; answer: string }[];

  @Column({ nullable: true, name: 'reading_time' })
  readingTime: number;

  @CreateDateColumn({ name: 'created_at', default: new Date() })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', default: new Date() })
  updatedAt: Date;
}
