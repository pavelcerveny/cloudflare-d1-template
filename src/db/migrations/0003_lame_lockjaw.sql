PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`currentCredits` integer DEFAULT 0 NOT NULL,
	`lastCreditRefreshAt` integer,
	`hashedPassword` text NOT NULL,
	`signUpIpAddress` text
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "createdAt", "updatedAt", "name", "email", "emailVerified", "image", "role", "currentCredits", "lastCreditRefreshAt", "hashedPassword", "signUpIpAddress") SELECT "id", "createdAt", "updatedAt", "name", "email", "emailVerified", "image", "role", "currentCredits", "lastCreditRefreshAt", "hashedPassword", "signUpIpAddress" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);