-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_replier_id_fkey" FOREIGN KEY ("replier_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
