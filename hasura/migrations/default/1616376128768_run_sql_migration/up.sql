INSERT INTO "system"."ConfigurationKey" VALUES
    ('HOST_ORGANISATION_NAME', 'The name of the organisation legally responsible for hosting this instance of the Clowdr software.'),
    ('TERMS_LATEST_REVISION_TIMESTAMP', 'The time of the latest revision of the host T&Cs. The value should be a Number representing the milliseconds elapsed since the UNIX epoch.'),
    ('TERMS_URL', 'URL to the host T&Cs. Note: If self hosting Clowdr, this must be your organisation''s terms - you cannot legally reuse, rely on or copy Clowdr''s terms.'),
    ('PRIVACY_POLICY_LATEST_REVISION_TIMESTAMP', 'The time of the latest revision of the host Privacy Policy. The value should be a Number representing the milliseconds elapsed since the UNIX epoch.'),
    ('PRIVACY_POLICY_URL', 'URL to the host Privacy Policy. Note: If self hosting Clowdr, this must be your organisation''s privacy policy - you cannot legally reuse, rely on or copy Clowdr''s privacy policy.'),
    ('COOKIE_POLICY_LATEST_REVISION_TIMESTAMP', 'The time of the latest revision of the host cookie policy. The value should be a Number representing the milliseconds elapsed since the UNIX epoch.'),
    ('COOKIE_POLICY_URL', 'The URL to the host cookie policy. Note: If self hosting Clowdr, this must be your organisation''s cookie policy - you cannot legally reuse, rely on or copy Clowdr''s cookie policy.');
