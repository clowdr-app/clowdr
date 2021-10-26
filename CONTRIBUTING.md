# Contributing

## Code style

- All committed code should be auto-formatted. We have Prettier and ESLint rules set up, so make sure your IDE understands these.

## Commit style

- When making a commit that changes the database (i.e. it will require other developers to run a Hasura migration), prepend your commit message with the 'card file box' emoji (🗃).

  - You can easily type it on Windows by pressing `Win + .` and typing `card f, Return`

- When making a commit that requires packages to be installed (e.g. running `npm install`), prepend your commit message with the 'package' emoji (📦).
- When making a commit that changes the AWS stacks and requires a redeploy, prepend your commit message with the 'cloud' emoji (☁).
- When making a commit that changes environment variables required, prepend your commit message with the 'deciduous tree' emoji (🌳).
- When making a commit that changes the authentication/authorization system(s), prepend your commit message the 'locked with key' emoji (🔐)
- When making a commit that has some other breaking change requiring developer action before or after applying it that does not fall into one of the above categories, prepend your commit message with the 'Heavy Exclamation Mark' emoji (❗)
