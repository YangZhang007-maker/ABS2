import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { ReminderEvent } from '../../reminder-event/entities/reminder-event.entity';

@Entity('schedule_events')
export class ScheduleEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.scheduleEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'varchar', length: 100 })
  eventType: string;

  @Column({ type: 'varchar', length: 300, name: 'schedule_name' })
  scheduleName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  remark: string | null;

  @Column({ type: 'timestamptz', name: 'event_date' })
  eventDate: Date;

  @OneToMany(() => ReminderEvent, (reminder) => reminder.scheduleEvent, {
    cascade: true,
    eager: false,
  })
  reminderEvents: ReminderEvent[];

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'boolean', default: false, name: 'completed' })
  completed: boolean;

  @Column({ type: 'varchar', length: 20, default: 'all', name: 'visibility' })
  visibility: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}