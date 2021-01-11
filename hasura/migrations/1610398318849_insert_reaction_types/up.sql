INSERT INTO chat."ReactionType" ("name", "description") VALUES
    ('EMOJI', 'A plain emoji reaction'),
    ('ANSWER', 'Link to a message that answers the question.'),
    ('POLL_CHOICE', 'A vote in a poll'),
    ('POLL_CLOSED', 'Stop accepting new responses to the poll'),
    ('POLL_COMPLETE', 'Make the poll results visible')
    ON CONFLICT DO NOTHING;
