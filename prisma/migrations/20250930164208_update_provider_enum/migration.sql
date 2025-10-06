-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('google.com', 'facebook.com', 'password', 'anonymous');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider" "Provider" NOT NULL DEFAULT 'password';
