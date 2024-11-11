ALTER TABLE "tags" DROP CONSTRAINT "tags_name_unique";--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "owner_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags" ADD CONSTRAINT "tags_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
