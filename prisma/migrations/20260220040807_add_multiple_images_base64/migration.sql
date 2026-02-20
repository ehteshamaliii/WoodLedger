-- CreateTable
CREATE TABLE `fabric_images` (
    `id` VARCHAR(191) NOT NULL,
    `fabric_type_id` VARCHAR(191) NOT NULL,
    `base64` LONGTEXT NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fabric_images_fabric_type_id_idx`(`fabric_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_images` (
    `id` VARCHAR(191) NOT NULL,
    `stock_id` VARCHAR(191) NOT NULL,
    `base64` LONGTEXT NOT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_images_stock_id_idx`(`stock_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fabric_images` ADD CONSTRAINT `fabric_images_fabric_type_id_fkey` FOREIGN KEY (`fabric_type_id`) REFERENCES `fabric_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_images` ADD CONSTRAINT `stock_images_stock_id_fkey` FOREIGN KEY (`stock_id`) REFERENCES `stock`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
