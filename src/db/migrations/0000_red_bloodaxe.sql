CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`athlete` integer NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`start_date_local` text NOT NULL,
	`distance` real NOT NULL,
	`total_elevation_gain` real NOT NULL,
	`average_speed` real NOT NULL,
	`average_watts` real,
	`average_cadence` real,
	`moving_time` integer NOT NULL,
	`elapsed_time` integer NOT NULL,
	`map_polyline` text,
	`are_streams_loaded` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activity_streams` (
	`primaryKey` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity` integer NOT NULL,
	`name` text NOT NULL,
	`series_type` text NOT NULL,
	`original_size` integer NOT NULL,
	`resolution` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`activity`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
