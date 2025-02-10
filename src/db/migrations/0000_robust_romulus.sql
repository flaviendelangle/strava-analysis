CREATE TABLE `activities` (
	`primaryKey` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`id` integer NOT NULL,
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
	`map_polyline` text
);
