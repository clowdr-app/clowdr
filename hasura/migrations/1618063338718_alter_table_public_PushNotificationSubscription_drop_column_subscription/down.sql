ALTER TABLE "public"."PushNotificationSubscription" ADD COLUMN "subscription" jsonb;
ALTER TABLE "public"."PushNotificationSubscription" ALTER COLUMN "subscription" DROP NOT NULL;
