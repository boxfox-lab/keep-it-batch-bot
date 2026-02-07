import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tmp_cache')
export class CacheEntity {
  @PrimaryColumn()
  key: string;

  @Column()
  value: string;

  @Column()
  time: Date;
}
