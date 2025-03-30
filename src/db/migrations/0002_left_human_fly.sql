ALTER TABLE `user` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `updatedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `hashedPassword` text;