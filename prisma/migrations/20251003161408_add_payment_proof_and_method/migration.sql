/*
  Warnings:

  - Added the required column `payment_method` to the `user_subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proof_of_payment` to the `user_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "payment_method_enum" AS ENUM ('baridimob', 'bank_transfer', 'e_payment');

-- AlterTable
ALTER TABLE "user_subscriptions" ADD COLUMN     "payment_method" "payment_method_enum" NOT NULL,
ADD COLUMN     "proof_of_payment" TEXT NOT NULL;
