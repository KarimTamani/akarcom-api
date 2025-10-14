/*
  Warnings:

  - You are about to drop the column `project_id` on the `project_units` table. All the data in the column will be lost.
  - You are about to drop the `project_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_videos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `description` to the `project_units` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `project_units` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "project_documents" DROP CONSTRAINT "project_documents_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_units" DROP CONSTRAINT "project_units_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_videos" DROP CONSTRAINT "project_videos_project_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_developer_id_fkey";

-- AlterTable
ALTER TABLE "project_units" DROP COLUMN "project_id",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "project_plan" TEXT,
ALTER COLUMN "num_rooms" DROP NOT NULL,
ALTER COLUMN "bethrooms" DROP NOT NULL;

-- DropTable
DROP TABLE "project_documents";

-- DropTable
DROP TABLE "project_videos";

-- DropTable
DROP TABLE "projects";
