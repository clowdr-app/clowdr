# Expose local services at a public URL

When you run Midspace locally, many parts of the system rely on exposing local
services at a public URL. For example:

- The actions service needs to receive SNS notifications from AWS and
  webhooks from Vonage.
- The Hasura service needs to receive GraphQL queries from Auth0.
- The frontend much prefers to be served over HTTPS.

Whenever your public URLs change, you will need to do the following:

1. [Update HASURA_URL](auth-setup.md) in the authentication rules settings.
1. [Update the video service callback URLs](video-service-setup.md) with the
   new actions service URL.
1. Reconfigure any local environment variables that point at the URL or
   domain of the frontend, actions service or Hasura service.

There are a couple of services that make it easy to do this: Packetriot and
[Ngrok](ngrok.md). You only need one of them. We recommend Packetriot unless you have
a particular reason to use ngrok.

## [Packetriot](https://packetriot.com)

[Packetriot](https://packetriot.com) costs \$5 per month. This gets you five
tunnels that support five ports each - i.e. five users. You can configure a
custom domain, so Google OAuth will work.

### Packetriot Setup (administrator)

1. Create a Packetriot account
1. [Download the client](https://docs.packetriot.com/quickstart/) and ensure
   it is on your `PATH`.
1. Follow the Packetriot instructions to verify your domain and set up an
   appropriate A/CNAME record.
1. In the root of the repository, run `pktriot --config pktriot.json configure --url`. Follow the instructions to authenticate and create a
   new tunnel. This will create a `pktriot.json` file with the credentials
   for a tunnel.
1. Add the following property to the JSON object, substituting your desired
   credentials.
   ```json
   "https": [
         {
               "domain": "<custom-frontend-subdomain>.<custom-domain>",
               "secure": true,
               "destination": "127.0.0.1",
               "port": 3000,
               "useLetsEnc": true,
               "redirect": true,
               "upstreamURL": ""
         },
         {
               "domain": "<custom-hasura-subdomain>.<custom-domain>",
               "secure": true,
               "destination": "127.0.0.1",
               "port": 8080,
               "useLetsEnc": true,
               "redirect": true,
               "upstreamURL": ""
         },
         {
               "domain": "<custom-actions-subdomain>.<custom-domain>",
               "secure": true,
               "destination": "127.0.0.1",
               "port": 3001,
               "useLetsEnc": true,
               "redirect": true,
               "upstreamURL": ""
         },
         {
               "domain": "<custom-playout-subdomain>.<custom-domain>",
               "secure": true,
               "destination": "127.0.0.1",
               "port": 3003,
               "useLetsEnc": true,
               "redirect": true,
               "upstreamURL": ""
         }
      ]
   ```
1. Run `pktriot start --config pktriot.json` to start the tunnel.

In subsequent setup steps, you will configure Auth0 and Vonage using your
custom domain.

To create a (persistent) tunnel for one of your team members, repeat the
penultimate two steps (with a different filename) and send the generated
JSON config to the team member.

### Packetriot Setup (team member)

1. Download the [pktriot client](https://docs.packetriot.com/quickstart/)
   and ensure it is on your `PATH`.
1. Request configuration file from your Packetriot administrator.
1. Put it in a file called `pktriot.json` in the root of the repository.
1. Launch by running the _Packetriot_ task or running
   `pktriot start --config pktriot.json`

Note: it may take a little while for Packetriot to acquire certificates initially.
