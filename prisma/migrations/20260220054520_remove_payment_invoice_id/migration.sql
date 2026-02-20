/*
  Warnings:

  - You are about to drop the column `invoice_id` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `stock` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `payments_invoice_id_idx` ON `payments`;

-- AlterTable
ALTER TABLE `payments` DROP COLUMN `invoice_id`;

-- AlterTable
ALTER TABLE `stock` DROP COLUMN `image_url`;
