import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Commerce extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, unique: true })
  token: string;

  @Column({ nullable: false, unique: true })
  code: string;

  @Column({ nullable: false, default: true })
  enabled: boolean;

  @Column({ nullable: false, default: false })
  isvtex: boolean;

  @Column({ nullable: true })
  vtexAppToken: string;

  @Column({ nullable: true })
  vtexAppKey: string;
}
