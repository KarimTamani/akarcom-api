-- AlterTable
ALTER TABLE "user_subscriptions" ALTER COLUMN "payment_method" DROP NOT NULL,
ALTER COLUMN "proof_of_payment" DROP NOT NULL;
