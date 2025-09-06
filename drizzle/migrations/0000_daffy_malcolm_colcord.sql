CREATE TABLE `assignment` (
	`submission_id` integer NOT NULL,
	`judge_group_id` integer NOT NULL,
	PRIMARY KEY(`judge_group_id`, `submission_id`),
	FOREIGN KEY (`submission_id`) REFERENCES `project_submission`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`judge_group_id`) REFERENCES `judge_group`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_name_unique` ON `category` (`name`);--> statement-breakpoint
CREATE TABLE `event` (
	`id` integer PRIMARY KEY NOT NULL,
	`timestamp` text NOT NULL,
	`description` text NOT NULL,
	`performed_by` integer,
	`target_participant_id` integer,
	`target_user_id` integer,
	`extra_info` text,
	FOREIGN KEY (`performed_by`) REFERENCES `participant`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_participant_id`) REFERENCES `participant`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "only_one_target" CHECK(("event"."target_participant_id" IS NOT NULL and "event"."target_user_id" IS NULL)
          OR ("event"."target_participant_id" IS NULL and "event"."target_user_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE `judge` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	`judge_group_id` integer,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`judge_group_id`) REFERENCES `judge_group`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `judge_email_unique` ON `judge` (`email`);--> statement-breakpoint
CREATE TABLE `judge_group` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mail_campaign` (
	`id` integer PRIMARY KEY NOT NULL,
	`template` text NOT NULL,
	`created_at` text NOT NULL,
	`recipient_count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mail_log` (
	`id` integer PRIMARY KEY NOT NULL,
	`mail_campaign_id` integer NOT NULL,
	`recipient_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	FOREIGN KEY (`mail_campaign_id`) REFERENCES `mail_campaign`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipient_id`) REFERENCES `participant`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participant` (
	`id` integer PRIMARY KEY NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`attendance_status` text DEFAULT 'registered' NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`age` integer NOT NULL,
	`gender` text NOT NULL,
	`school` text NOT NULL,
	`graduation_year` integer NOT NULL,
	`level_of_study` text NOT NULL,
	`country` text NOT NULL,
	`major` text NOT NULL,
	`diet_restrictions` text DEFAULT '' NOT NULL,
	`resume_url` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	`deleted_at` text,
	`last_confirmed_attendance_at` text,
	`checkedin_at` text,
	`name_email` text GENERATED ALWAYS AS (lower("first_name" || ' ' || "last_name" || ' ' || "email")) VIRTUAL NOT NULL
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`url` text,
	`location` text NOT NULL,
	`location2` text NOT NULL,
	`disqualify_reason` text
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`secret_hash` blob NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project_submission` (
	`id` integer PRIMARY KEY NOT NULL,
	`project_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_and_category` ON `project_submission` (`project_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`is_disabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);