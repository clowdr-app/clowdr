UPDATE "Invitation" SET "invitedEmailAddress" = LOWER("invitedEmailAddress");
UPDATE "User" SET "email" = LOWER("email");

CREATE OR REPLACE FUNCTION chat.lowercase_invited_email_address()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    nid uuid;
BEGIN
    NEW."invitedEmailAddress" := LOWER(NEW."invitedEmailAddress");
	RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION chat.lowercase_user_email_address()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    nid uuid;
BEGIN
    NEW."email" := LOWER(NEW."email");
	RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION chat.lowercase_uploader_email_address()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    nid uuid;
BEGIN
    NEW."email" := LOWER(NEW."email");
	RETURN NEW;
END;
$$;

CREATE TRIGGER lowercase_email BEFORE INSERT ON "Invitation" FOR EACH ROW EXECUTE PROCEDURE chat.lowercase_invited_email_address();
CREATE TRIGGER lowercase_email BEFORE INSERT ON "User" FOR EACH ROW EXECUTE PROCEDURE chat.lowercase_user_email_address();
CREATE TRIGGER lowercase_email BEFORE INSERT ON "Uploader" FOR EACH ROW EXECUTE PROCEDURE chat.lowercase_uploader_email_address();
