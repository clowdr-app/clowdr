Please ensure your PR title includes the relevant emoji signifiers. See
[CONTRIBUTING] for details.

## What's [new / improved / fixed]

- For new features (from a feature/ branch), describe what is _new_.
- For improvements (from an improvement/ branch), describe the system's original
  behaviour, its new behaviour and why this is an improvement / who this
  benefits.
- For bug fixes, please briefly summarise the cause of the bug and how you have
  fixed it.

## Details

- Related issue: #[Insert issue number]

## Upgrading

Instructions for other developers on how to upgrade their environment after
pulling this new code. Please tick (i.e. put an 'x' in) the boxes for the
actions that are necessary.

- [ ] Run GraphQL Codegen in the [frontend/actions service/playout service/realtime service]
- [ ] Re-install NPM packages in [insert name of folder]
- [ ] Apply Hasura migrations
- [ ] Apply Hasura metadata
- [ ] Update Auth0 rules
- [ ] Update environment variables
- [ ] Re-deploy AWS CDK [and update AWS environment variables]

## Deployment

Instructions for how to deploy these changes to production. Please tick (i.e.
put an 'x' in) the boxes for the actions that are necessary.

- [ ] Apply migrations to Hasura
- [ ] Apply metadata to Hasura
- [ ] Reload enum table/values in Hasura for [table names]
- [ ] Re-deploy frontend
- [ ] Re-deploy actions service
- [ ] Re-deploy playout service
- [ ] Re-deploy real-time service
- [ ] Flush real-time service state (Redis/RabbitMQ)
- [ ] Update environment variables for [name of component]

Any other steps necessary to re-deploy?
