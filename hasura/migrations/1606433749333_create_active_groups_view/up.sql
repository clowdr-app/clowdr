CREATE VIEW "ActiveGroup" AS
  SELECT g.*
  FROM "Group" g
  WHERE now() BETWEEN g."accessStart" AND g."accessEnd";
