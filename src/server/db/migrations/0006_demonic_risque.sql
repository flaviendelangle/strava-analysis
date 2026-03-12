ALTER TABLE "rider_settings" ADD COLUMN "cycling_load_algorithm" text DEFAULT 'tss' NOT NULL;--> statement-breakpoint
ALTER TABLE "rider_settings" ADD COLUMN "running_load_algorithm" text DEFAULT 'rtss' NOT NULL;--> statement-breakpoint
ALTER TABLE "rider_settings" ADD COLUMN "swimming_load_algorithm" text DEFAULT 'stss' NOT NULL;