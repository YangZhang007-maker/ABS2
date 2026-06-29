-- ABS 存续期智能提醒系统 - 数据库初始化脚本
-- 数据库: ABS, 用户: postgres, 密码: admin123

-- 创建数据库（如果不存在）
-- CREATE DATABASE "ABS" OWNER postgres;

-- 连接到 ABS 数据库后执行以下语句

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    creator VARCHAR(100) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 日程事件表
CREATE TYPE event_type_enum AS ENUM ('establishment', 'payment', 'calculation');

CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    event_type event_type_enum NOT NULL,
    schedule_name VARCHAR(300) NOT NULL,
    remark VARCHAR(200),
    event_date TIMESTAMPTZ NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_events_product ON schedule_events(product_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_schedule_events_date ON schedule_events(event_date) WHERE is_deleted = FALSE;

-- 提醒事件表
CREATE TYPE date_mode_enum AS ENUM ('relative', 'manual');
CREATE TYPE ref_type_enum AS ENUM ('T', 'R');

CREATE TABLE IF NOT EXISTS reminder_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_event_id UUID NOT NULL REFERENCES schedule_events(id) ON DELETE CASCADE,
    reminder_name VARCHAR(200) NOT NULL,
    date_mode date_mode_enum NOT NULL,
    ref_type ref_type_enum,
    offset_days INTEGER,
    manual_date TIMESTAMPTZ,
    trigger_date TIMESTAMPTZ NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminder_events_schedule ON reminder_events(schedule_event_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_reminder_events_trigger ON reminder_events(trigger_date) WHERE is_deleted = FALSE;