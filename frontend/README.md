# Clowdr: Frontend

React web app that forms the main Clowdr frontend.

> ✨ Bootstrapped with Create Snowpack App (CSA).

## Pre-requisites

1. `serve` tool (for testing production builds): `npm i -g serve`

## Setting up

1. Follow the root README instructions for configuring Auth0. Then come back here.
   BCP: Why not just swap steps 8 and 9 in the top-level setup?
2. Copy the `frontend/.env.example` to a new `frontend/.env` file.
3. Configure your `.env` file according to the [Frontend
   Configuration](#frontend-configuration) section below.
4. Build and test the system locally (see [Local Development](#local-development)
   below).
5. **Full Setup**: If using Netlify, then:

   - Once you have set up Hasura Cloud, create a Netlify account and
     follow the steps below.
   - in Netlify, create a new site from Git.
     - If you're not part of the core Clowdr team, create and use a fork of this
       (`clowdr-app/clowdr`) repository.
     - See _[Deployment to Netlify](#deployment-to-netlify)_ for instructions.

6. If using Netlify, go back to Auth0 and add the Netlify app url(s) to the
   application configuration (see instructions in root README).

## UI Components, Theming, and Icons

We use [Chakra UI](https://chakra-ui.com/) to build accessible, consistent UIs
with [theming](@chakra-ui/theme-tools). Chakra also provides
[icons](https://chakra-ui.com/docs/components/icon) and a system for [custom
components](@chakra-ui/theme-tools).

## GraphQL

After writing, modifying or delete a GraphQL query in the frontend, you will
need to regenerate the GraphQL code. You can do this using the VSCode Task
`Frontend -- GraphQL Codegen`.

## Local Development

See root README _Local Development_ instructions for local development for
which tasks to run.

If the environment configuration changes, or for example, the `package.json`
commands change, then you will need to restart tasks for this frontend.

## Testing

We use React Testing Library (with extensions) on top of Jest for testing the
frontend. This includes Continuous Integration.

You should check out the documentation for the following Jest extension
libraries that we use for writing better tests:

- Accessibility: [jest-axe -
  https://www.npmjs.com/package/jest-axe](https://www.npmjs.com/package/jest-axe)
- React Testing Library extensions:

  - [@testing-library/jest-dom -
    https://github.com/testing-library/jest-dom](https://github.com/testing-library/jest-dom)
  - [@testing-library/user-event -
    https://github.com/testing-library/user-event](https://github.com/testing-library/user-event)
  - [@testing-library/react-hooks -
    https://github.com/testing-library/react-hooks-testing-library](https://github.com/testing-library/react-hooks-testing-library)

    Quoting from the `@testing-library/react-hooks` docs:

    > #### When to use this library
    >
    > - You're writing a library with one or more custom hooks that are not
    >   directly tied to a component
    > - You have a complex hook that is difficult to test through component
    >   interactions
    >
    > #### When not to use this library
    >
    > - Your hook is defined alongside a component and is only used there
    > - Your hook is easy to test by just testing the components using it

## Production builds

- Use the VSCode (build) task: `Frontend -- Production Build`
- Use the VSCode task: `Frontend -- Serve Production Build`

Alternatively:

1. To build: `frontend> npm run build` Builds a static copy of the frontend to
   the `build/` folder using snowpack & webpack.
1. To test: `frontend> serve -s build` Serves the static build locally for
   checking.

## Deployment to Netlify

The frontend can easily be deployed using Netlify:

1. Connect to GitHub, select the relevant repo and branch
1. Leave the base directory blank
1. Build command: `cd shared && npm ci && cd ../frontend && npm ci && npm run build`
1. Publish directory: `frontend/build`
1. Environment variables: As below

## Developer Notes

### react-transcript-editor

Because JavaScript monorepos are hard, we currently resort to building a single-file ESM version of [@bbc/react-transcript-editor](https://www.npmjs.com/package/@bbc/react-transcript-editor) and vendoring (i.e. copy-pasting) it into the `src/` directory of this project.

A fork of the transcript editor is included as a Git submodule of this repository. There are a couple of key changes:

- A custom Rollup configuration that bundles the `TranscriptEditor` component as an ES module
- The docx support is commented out (because it doubles the bundle size)

If you need to build a new version, run `npm run build:transcript-editor` and copy the resulting `output/TranscriptEditor.js` file into the frontend.

## Frontend Configuration

**_Note:_** Snowpack (the build tool we use) will only include environment
variables in the build which start with `SNOWPACK_PUBLIC_`.

**_Note:_** Pay attention to the _Netlify?_ column when configuring Netlify. _No_ means 'do not add to Netlify'; _Yes_ means 'add to Netlify'; _Only_ means 'only add in Netlify, not locally'.

| Env Var                                      | Value                                                                                | Netlify? |
| -------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| HASURA_ADMIN_SECRET                          | Admin secret (used only for GraphQL Codegen)                                         | No       |
| _GraphQL_                                    |                                                                                      |          |
| SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN           | The domain and port of the GraphQL server                                            | Yes      |
| SNOWPACK_PUBLIC_GRAPHQL_API_SECURE_PROTOCOLS | Boolean. Default: true. Whether to use https/wss or not.                             | Yes      |
| _Auth0_                                      |                                                                                      |          |
| SNOWPACK_PUBLIC_AUTH_DOMAIN                  | <auth0-domain> e.g. `something.eu.auth0.com`                                         | Yes      |
| SNOWPACK_PUBLIC_AUTH_CLIENT_ID               | <auth0-client-id> as shown in Auth0 Application                                      | Yes      |
| _AWS_                                        |                                                                                      |          |
| SNOWPACK_PUBLIC_COMPANION_BASE_URL           | URL of the Uppy Companion instance (provided at `/companion` by the actions service) | Yes      |
| NPM_VERSION                                  | `7.3` (only required in Netlify)                                                     | Only     |
| NODE_VERSION                                 | `15.4` (only required in Netlify)                                                    | Only     |
| _Vonage Video API_                           |                                                                                      |
| SNOWPACK_PUBLIC_OPENTOK_API_KEY              | API key for the Vonage Video API project                                             |          |
| SNOWPACK_PRESENCE_SERVICE_URL                | URL to the presence service.                                                         |
