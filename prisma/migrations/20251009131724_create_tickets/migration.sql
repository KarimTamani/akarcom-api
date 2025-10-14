-- CreateEnum
CREATE TYPE "tickets_status_enum" AS ENUM ('opened', 'closed', 'faq');

-- CreateTable
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "tickets_status_enum" NOT NULL DEFAULT 'opened',
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "answer" TEXT,
    "replier_id" INTEGER,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);
