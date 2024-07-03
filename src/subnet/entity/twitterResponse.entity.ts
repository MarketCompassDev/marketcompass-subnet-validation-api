import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class TwitterResponseEntity {
  @PrimaryGeneratedColumn()
  responseId: number;

  @Column({ type: 'varchar', length: 255 })
  validatorId: string;

  @Column({ type: 'varchar', length: 255 })
  minerId: string;

  @Column()
  promptId: number;

  @CreateDateColumn()
  timestamp: Date;

  @Column('mediumtext')
  content: string;
}
