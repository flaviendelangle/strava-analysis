ALTER TABLE "athletes" ADD COLUMN "refresh_token" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "athletes" ADD COLUMN "token_expires_at" integer DEFAULT 0 NOT NULL;