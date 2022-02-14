# Midspace: Frontend

React web app that forms the main Midspace frontend.

> ✨ Bootstrapped with Create Snowpack App (CSA).

## Pre-requisites

1. All other setup steps! Set up the frontend last.

## Setting up

1. `cd frontend`
1. `cp .env.example .env`
1. Configure your `.env` file according to the [Frontend
   Configuration](#frontend-configuration) section below.
1. Return to the main README for steps to generate GraphQL client code and start your local working copy.
1. **Production**: If using Netlify, then:
   - Once you have set up Hasura Cloud, create a Netlify account and
     follow the steps below.
   - in Netlify, create a new site from Git.
     - If you're not part of the core Midspace team, create and use a fork of this
       (`clowdr-app/clowdr`) repository.
     - See _[Deployment to Netlify](#deployment-to-netlify)_ for instructions.
   - go back to Auth0 and add the Netlify app url(s) to the
     application configuration (see instructions in root README).

## UI Components, Theming, and Icons

We use [Chakra UI](https://chakra-ui.com/) to build accessible, consistent UIs
with [theming](@chakra-ui/theme-tools). Chakra also provides
[icons](https://chakra-ui.com/docs/components/icon) and a system for [custom
components](@chakra-ui/theme-tools).

## GraphQL

After writing, modifying or delete a GraphQL query in the frontend, you will
need to regenerate the GraphQL code. You can do this using the VSCode Task
`Single -- GraphQL Codegen` and selecting `frontend` (Hasura must be running).

## Local Development

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

1. To build: `frontend> pnpm build` Builds a static copy of the frontend to
   the `build/` folder using snowpack & webpack.
1. To test: `frontend> pnpx serve -s build` Serves the static build locally for
   checking.

## Deployment to Netlify

The frontend can easily be deployed using Netlify:

1. Connect to GitHub, select the relevant repo and branch
1. Leave the base directory blank
1. Build command: `cd ../frontend && pnpm build`
1. Publish directory: `frontend/build`
1. Environment variables: As below

## Frontend Configuration

**_Note:_** Snowpack (the build tool we use) will only include environment
variables in the build which start with `VITE_`.

**_Note:_** Pay attention to the _Netlify?_ column when configuring Netlify. _No_ means 'do not add to Netlify'; _Yes_ means 'add to Netlify'; _Only_ means 'only add in Netlify, not locally'.

| Env Var                           | Value                                                                                | Netlify? |
| --------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| HASURA_ADMIN_SECRET               | Admin secret (used only for GraphQL Codegen)                                         | No       |
| _GraphQL_                         |                                                                                      |          |
| VITE_GRAPHQL_API_DOMAIN           | The domain and port of the GraphQL server                                            | Yes      |
| VITE_GRAPHQL_API_SECURE_PROTOCOLS | Boolean. Default: true. Whether to use https/wss or not.                             | Yes      |
| _Auth0_                           |                                                                                      |          |
| VITE_AUTH_DOMAIN                  | <auth0-domain> e.g. `something.eu.auth0.com`                                         | Yes      |
| VITE_AUTH_CLIENT_ID               | <auth0-client-id> as shown in Auth0 Application                                      | Yes      |
| _AWS_                             |                                                                                      |          |
| VITE_COMPANION_BASE_URL           | URL of the Uppy Companion instance (provided at `/companion` by the actions service) | Yes      |
| NPM_VERSION                       | `7.3` (only required in Netlify)                                                     | Only     |
| NODE_VERSION                      | `17.4` (only required in Netlify)                                                    | Only     |
| _Vonage Video API_                |                                                                                      |
| VITE_OPENTOK_API_KEY              | API key for the Vonage Video API project                                             |          |
| VITE_PRESENCE_SERVICE_URL         | URL to the presence service.                                                         |          |
| _Other_                           |                                                                                      |          |
| VITE_TECH_SUPPORT_ADDRESS         | Email address for contacting tech support                                            | Yes      |
