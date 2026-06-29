import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { ScheduleEvent } from '../../schedule-event/entities/schedule-event.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'uuid', name: 'schedule_event_id', nullable: true })
  scheduleEventId: string | null;

  @Column({ type: 'varchar', length: 500, name: 'file_name' })
  fileName: string;

  @Column({ type: 'varchar', length: 500, name: 'original_name' })
  originalName: string;

  @Column({ type: 'varchar', length: 200, name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'bigint', name: 'file_size' })
  fileSize: number;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @ManyToOne(() => Product, (product) => product.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ScheduleEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'schedule_event_id' })
  scheduleEvent: ScheduleEvent | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}