# How to set up a custom domain for a conference

Steps to follow as a system administrator:

1. Add `FRONTEND_HOST` (no trailing slash) conference configuration record
2. Add the new frontend host (no trailing slash) to the following
   comma-separated lists:
   1. Hasura CORS origins: `HASURA_GRAPHQL_CORS_DOMAIN`
   2. Realtime Service: `CORS_ORIGIN`
   3. Actions Service: `CORS_ORIGIN`
   4. Auth0 Application allowed redirect URIs and allowed origins
   5. Google Cloud Platform
      - `GCP -> APIs and Services -> Credentials / Client ID for Web application -> URIs`
3. Restart the realtime and actions services
   - If self-hosting Hasura GQL engine, restart it too.
4. Netlify: Add the additional domain and wait for the SSL certificate to
   regenerate
5. Set up a CNAME record to point the custom domain at your Netlify instance (or, if in development, Packetriot)
6. Test that everything works:
   1. Upload a profile picture.
   2. Send a chat message. Refresh to see if it's still there.
   3. In the Admin Export page, connect a Google account.
   4. Send yourself a submission request email. Check the submission link takes
      you to the custom domain.
