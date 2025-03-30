ALTER TABLE `user` ADD `currentCredits` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `lastCreditRefreshAt` integer;