-- DropForeignKey
ALTER TABLE "social_media" DROP CONSTRAINT "social_media_user_id_fkey";

-- AddForeignKey
ALTER TABLE "social_media" ADD CONSTRAINT "social_media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
