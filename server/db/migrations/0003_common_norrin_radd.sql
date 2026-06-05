ALTER TABLE "events" ALTER COLUMN "starts_at" SET DATA TYPE timestamp with time zone USING "starts_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "ends_at" SET DATA TYPE timestamp with time zone USING "ends_at" AT TIME ZONE 'UTC';
