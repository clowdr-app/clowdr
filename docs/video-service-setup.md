# Vonage Setup

Midspace uses the Vonage Video API (formerly TokBox OpenTok) for video chat.

## Part 1

1. Create a free
   [Vonage Video API](https://www.vonage.co.uk/communications-apis/video/)
   account; then go to `Projects > Create New Project`, choose "Custom", and
   make a note of the API key that is generated.
1. If you have not already, generate a secure random value and note it as `VONAGE_WEBHOOK_SECRET`.

Return to the main README and continue with Part 2 after setting up the actions service.

## Part 2 (After Actions Service Setup)

1. Ensure that the Packetriot task `Packetriot` (or your preferred tunnel setup) and the actions service task `Actions Service -- Local Development` are running before proceeding to the next steps. Vonage will not accept the required URLs if they are not exposed via a tunnel.
1. Open the _Project Settings_ for the Vonage Video API project you created.
1. Use the `VONAGE_WEBHOOK_SECRET` value, the Actions Service public URL, and
   the following path to set the Session Monitoring URL:
   - `https://<custom-actions-subdomain>.<custom-domain>/vonage/sessionMonitoring/<VONAGE_WEBHOOK_SECRET>`
1. In the AWS CloudFormation `dev-main` stack, click the Outputs tab, find the
   following values, and use them to set up Archiving Cloud Storage in your
   Vonage Video API Project Settings. Without this recordings will only be
   stored temporarily in Vonage and won't be accessible from the app. For extra
   security, you can set the `VONAGE_API_KEY` env var and redeploy the AWS stack.
   - `VonageUserAccessKeyId`
   - `VonageUserSecretAccessKey`
   - `ContentBucketId`
1. Use the `VONAGE_WEBHOOK_SECRET` value, the Actions Service public URL, and
   the following path to set the Archiving Callback URL:
   - `http://<custom-actions-subdomain>.<custom-domain>/vonage/sessionMonitoring/<VONAGE_WEBHOOK_SECRET>`

Return to the main README and continue with [Setting Up Local Working Copy](../README.md#setting-up-local-working-copy).
