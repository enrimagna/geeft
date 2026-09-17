CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `affiliate_network` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`priority` integer DEFAULT 100 NOT NULL,
	`host_patterns` text NOT NULL,
	`tag_param` text DEFAULT 'tag' NOT NULL,
	`tag_value` text DEFAULT '' NOT NULL,
	`extra_params` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliate_network_key_unique` ON `affiliate_network` (`key`);
--> statement-breakpoint
CREATE INDEX `affiliate_network_priority_idx` ON `affiliate_network` (`priority`);
--> statement-breakpoint
CREATE INDEX `affiliate_network_enabled_idx` ON `affiliate_network` (`enabled`);
--> statement-breakpoint
CREATE TABLE `affiliate_click` (
	`id` text PRIMARY KEY NOT NULL,
	`gift_id` text NOT NULL,
	`user_id` text,
	`network_id` text,
	`original_host` text NOT NULL,
	`rewritten` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`ua_hash` text,
	FOREIGN KEY (`gift_id`) REFERENCES `gift`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`network_id`) REFERENCES `affiliate_network`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `affiliate_click_created_idx` ON `affiliate_click` (`created_at`);
--> statement-breakpoint
CREATE INDEX `affiliate_click_network_created_idx` ON `affiliate_click` (`network_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `affiliate_click_gift_idx` ON `affiliate_click` (`gift_id`);
