import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ScheduleEvent } from '../../schedule-event/entities/schedule-event.entity';
import { DateMode, RefType } from '../../../common/enums/date-mode.enum';

@Entity('reminder_events')
export class ReminderEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ScheduleEvent, (event) => event.reminderEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schedule_event_id' })
  scheduleEvent: ScheduleEvent;

  @Column({ type: 'uuid', name: 'schedule_event_id' })
  scheduleEventId: string;

  @Column({ type: 'varchar', length: 200, name: 'reminder_name' })
  reminderName: string;

  @Column({
    type: 'enum',
    enum: DateMode,
  })
  dateMode: DateMode;

  @Column({
    type: 'enum',
    enum: RefType,
    nullable: true,
    name: 'ref_type',
  })
  refType: RefType | null;

  @Column({ type: 'int', nullable: true, name: 'offset_days' })
  offsetDays: number | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'manual_date' })
  manualDate: Date | null;

  @Column({ type: 'timestamptz', name: 'trigger_date' })
  triggerDate: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'boolean', default: false, name: 'completed' })
  completed: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}