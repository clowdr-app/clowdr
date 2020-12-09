CREATE OR REPLACE FUNCTION InvitationHash(invitation_row "Invitation")
RETURNS TEXT AS $$
  SELECT encode(digest(invitation_row."inviteCode" || invitation_row."invitedEmailAddress", 'sha256'), 'base64')
$$ LANGUAGE sql STABLE;
