CREATE TYPE "public"."sync_job_mode" AS ENUM('load_new', 'load_missing', 'reload_all', 'recompute_scores');--> statement-breakpoint
ALTER TABLE "sync_jobs" ADD COLUMN "mode" "sync_job_mode";