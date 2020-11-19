# Clowdr: Frontend

React web app that forms the main Clowdr frontend.

> ✨ Bootstrapped with Create Snowpack App (CSA).

## Pre-requisites

1. `serve` tool (for testing production builds): `npm i -g serve`

## Setting up

Nothing to do here, at the moment!

## Local Development

See root ReadMe instructions for local development for which tasks to run.

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

## Deployment

The frontend can easily be deployed using Netlify:

1. Connect to GitHub, select the relevant repo and branch
1. Leave the base directory blank
1. Build command: `cd frontend && npm i && npm run build`
1. Publish directory: `frontend/build`
1. Environment variables: As below

## Frontend Configuration

**_Note:_** Snowpack (the build tool we use) will only include environment
variables in the build which start with `SNOWPACK_PUBLIC_`.

| Env Var                                      | Value                                                    |
| -------------------------------------------- | -------------------------------------------------------- |
| SNOWPACK_PUBLIC_GRAPHQL_API_DOMAIN           | The domain and port of the GraphQL server                |
| SNOWPACK_PUBLIC_GRAPHQL_API_SECURE_PROTOCOLS | Boolean. Default: true. Whether to use https/wss or not. |
