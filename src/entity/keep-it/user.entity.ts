import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FCMTokenEntity } from './fcm-token.entity';
import { AuthEntity } from './auth.entity';

@Entity('app_user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => AuthEntity, (a) => a.user)
  @JoinColumn()
  auth: AuthEntity[];

  @Column({ nullable: true, name: 'registered_at' })
  registeredAt: Date;

  @OneToMany(() => FCMTokenEntity, (t) => t.user)
  @JoinColumn()
  fcm: FCMTokenEntity[];

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, name: 'original_profile_image_url' })
  originalProfileImageUrl: string;

  @Column({ nullable: true, name: 'profile_image_url' })
  profileImageUrl: string;

  @Column({ default: '{}', name: 'attribute', type: 'json' })
  attribute: Record<string, any>;

  @Column({ nullable: true, name: 'description_prompt' })
  descriptionPrompt: string;
}
