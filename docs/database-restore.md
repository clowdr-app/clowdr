# Restoring database from a backup

- Download the backup from Heroku and copy it into the `<project dir>/restore` directory
- Start only the database and pgAdmin with `docker-compose -p db-restore -f docker-compose.db.yaml -f docker-compose.db-restore.yaml --env-file ./hasura/.env.local up`
- Restore from the backup: `docker-compose -p db-restore --env-file ./hasura/.env.local exec postgres pg_restore --verbose --clean --no-acl --no-owner -h localhost -U postgres -d postgres /var/restore/latest.dump`, replacing `latest.dump` with the filename of your backup.
  - You can list the contents of the backup file by running `docker-compose -p db-restore --env-file ./hasura/.env.local exec postgres pg_restore -l /var/restore/latest.dump`
- Start the Hasura container: `docker-compose -p db-restore -f docker-compose.yaml -f docker-compose.db.yaml -f docker-compose.db-restore.yaml --env-file ./hasura/.env.local up`
  - Recommendation: set `HASURA_GRAPHQL_ENABLE_MAINTENANCE_MODE=true` in `hasura/env.local`
  - Recommendation: comment out `- ./hasura/migrations:/hasura-migrations` mount in `docker-compose.yaml`
- Start the Hasura console

## Troubleshooting

### Hasura won't start because it can't create the hdb_cron_events_unique_scheduled index

You might have entries with duplicate `trigger_name`, `scheduled_time` pairs in the `hdb_catalog.hdb_cron_events` table. You can view these with the following query:

```sql
SELECT *
FROM
(
    SELECT COUNT(id) AS count,
           array_agg(id) ids,
           array_agg(trigger_name) AS trigger_names,
           array_agg(scheduled_time) AS scheduled_times
    FROM hdb_catalog.hdb_cron_events
    GROUP BY trigger_name,
             scheduled_time
) a
WHERE count > 1
```

You can delete the later-created of any duplicates using the following query:

```sql
DELETE  FROM
    hdb_catalog.hdb_cron_events a
        USING hdb_catalog.hdb_cron_events b
WHERE
    a.created_at > b.created_at
    AND a.trigger_name = b.trigger_name
	AND a.scheduled_time = b.scheduled_time;
```
