-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ShoppingListItemSource" AS ENUM ('telegram_voice', 'telegram_text', 'dashboard');

-- CreateEnum
CREATE TYPE "IdeaSource" AS ENUM ('telegram', 'dashboard');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('telegram');

-- CreateEnum
CREATE TYPE "ScheduledNotificationStatus" AS ENUM ('pending', 'sending', 'sent', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "TrainingSessionSource" AS ENUM ('dashboard', 'telegram', 'shortcut');

-- CreateEnum
CREATE TYPE "AuditChannel" AS ENUM ('telegram', 'dashboard', 'system');

-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "telegram_chat_id" BIGINT,
    "telegram_link_token" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "source" "ShoppingListItemSource" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "title" VARCHAR(200),
    "source" "IdeaSource" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BirthdayReminder" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "person_name" TEXT NOT NULL,
    "next_occurrence_on" DATE NOT NULL,
    "original_year_known" BOOLEAN NOT NULL DEFAULT true,
    "lead_days" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "BirthdayReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledNotification" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "birthday_reminder_id" TEXT,
    "fire_at" TIMESTAMPTZ(6) NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "ScheduledNotificationStatus" NOT NULL DEFAULT 'pending',
    "idempotency_key" VARCHAR(500) NOT NULL,
    "last_error" VARCHAR(2000),
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "occurred_on" DATE NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'training',
    "source" "TrainingSessionSource" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "action" VARCHAR(200) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" TEXT,
    "channel" "AuditChannel" NOT NULL,
    "metadata" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_email_key" ON "Owner"("email");

-- CreateIndex
CREATE INDEX "ShoppingListItem_owner_id_idx" ON "ShoppingListItem"("owner_id");

-- CreateIndex
CREATE INDEX "Idea_owner_id_idx" ON "Idea"("owner_id");

-- CreateIndex
CREATE INDEX "BirthdayReminder_owner_id_idx" ON "BirthdayReminder"("owner_id");

-- CreateIndex
CREATE INDEX "ScheduledNotification_status_fire_at_idx" ON "ScheduledNotification"("status", "fire_at");

-- CreateIndex
CREATE INDEX "ScheduledNotification_owner_id_fire_at_idx" ON "ScheduledNotification"("owner_id", "fire_at");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledNotification_owner_id_idempotency_key_key" ON "ScheduledNotification"("owner_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "TrainingSession_owner_id_idx" ON "TrainingSession"("owner_id");

-- CreateIndex
CREATE INDEX "AuditLog_owner_id_created_at_idx" ON "AuditLog"("owner_id", "created_at");

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirthdayReminder" ADD CONSTRAINT "BirthdayReminder_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_birthday_reminder_id_fkey" FOREIGN KEY ("birthday_reminder_id") REFERENCES "BirthdayReminder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

