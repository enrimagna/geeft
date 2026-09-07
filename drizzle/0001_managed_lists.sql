CREATE TABLE `list_admin` (
	`list_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`list_id`, `user_id`),
	FOREIGN KEY (`list_id`) REFERENCES `gift_list`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `list_admin_user_idx` ON `list_admin` (`user_id`);--> statement-breakpoint
CREATE INDEX `list_admin_list_idx` ON `list_admin` (`list_id`);--> statement-breakpoint
DROP INDEX `gift_list_family_owner_uidx`;--> statement-breakpoint
CREATE UNIQUE INDEX `gift_list_personal_owner_uidx` ON `gift_list` (`family_id`,`owner_id`) WHERE "gift_list"."is_personal" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX `gift_list_managed_name_uidx` ON `gift_list` (`family_id`,`name`) WHERE "gift_list"."is_personal" = 0;