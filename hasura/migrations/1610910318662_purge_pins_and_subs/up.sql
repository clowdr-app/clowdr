DROP TRIGGER IF EXISTS update_pins ON chat."Chat";
DROP TRIGGER IF EXISTS update_subscriptions ON chat."Chat";
DROP TRIGGER IF EXISTS prevent_delete_pins ON chat."Pin";
DROP TRIGGER IF EXISTS prevent_delete_subscriptions ON chat."Subscription";

DELETE FROM "chat"."Pin";
DELETE FROM "chat"."Subscription";
