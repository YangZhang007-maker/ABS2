import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ScheduleEvent } from '../../schedule-event/entities/schedule-event.entity';
import { Document } from '../../document/entities/document.entity';
import { User } from '../../user/entities/user.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  creator: string;

  @Column({ type: 'uuid', name: 'creator_id', nullable: true })
  creatorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id' })
  creatorUser: User | null;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @OneToMany(() => ScheduleEvent, (event) => event.product, {
    cascade: true,
    eager: false,
  })
  scheduleEvents: ScheduleEvent[];

  @OneToMany(() => Document, (doc) => doc.product, {
    cascade: true,
    eager: false,
  })
  documents: Document[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}