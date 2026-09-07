CREATE TABLE `list_family` (
	`list_id` text NOT NULL,
	`family_id` text NOT NULL,
	PRIMARY KEY(`list_id`, `family_id`),
	FOREIGN KEY (`list_id`) REFERENCES `gift_list`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`family_id`) REFERENCES `family`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `list_family_family_idx` ON `list_family` (`family_id`);
--> statement-breakpoint
INSERT INTO `list_family` (`list_id`, `family_id`)
SELECT `id`, `family_id` FROM `gift_list` WHERE `is_personal` = 0;
--> statement-breakpoint
CREATE TABLE `keep_personal` (`keep_id` text PRIMARY KEY NOT NULL, `owner_id` text NOT NULL);
--> statement-breakpoint
INSERT INTO `keep_personal` (`keep_id`, `owner_id`)
SELECT MIN(`id`), `owner_id` FROM `gift_list` WHERE `is_personal` = 1 GROUP BY `owner_id`;
--> statement-breakpoint
UPDATE `gift`
SET `list_id` = (
	SELECT `keep_id` FROM `keep_personal`
	WHERE `keep_personal`.`owner_id` = (
		SELECT `owner_id` FROM `gift_list` WHERE `gift_list`.`id` = `gift`.`list_id`
	)
)
WHERE `list_id` IN (SELECT `id` FROM `gift_list` WHERE `is_personal` = 1)
	AND `list_id` NOT IN (SELECT `keep_id` FROM `keep_personal`);
--> statement-breakpoint
DELETE FROM `gift_list`
WHERE `is_personal` = 1
	AND `id` NOT IN (SELECT `keep_id` FROM `keep_personal`);
--> statement-breakpoint
DROP TABLE `keep_personal`;
--> statement-breakpoint
DROP INDEX `gift_list_personal_owner_uidx`;
--> statement-breakpoint
CREATE UNIQUE INDEX `gift_list_personal_owner_uidx` ON `gift_list` (`owner_id`) WHERE "gift_list"."is_personal" = 1;
