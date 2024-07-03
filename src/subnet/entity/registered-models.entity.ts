import { Entity, Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class RegisteredModelsEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  discordUser: string;

  @Column({ type: 'varchar', length: 255 })
  ipAddress: string;

  @Column()
  isBlacklisted: boolean;

  @Column()
  isValidator: boolean;

  @Column()
  modelId: number;

  @CreateDateColumn()
  timestamp: Date;
}
