# How to set up a custom domain for a conference

Steps to follow as a system administrator.

1. Add `FRONTEND_HOST` conference configuration
2. Add the new frontend host to the:
   1. Realtime Service `CORS_ORIGIN` (comma separated list)
   2. Google Cloud Platform
      - GCP -> APIs and Services -> Credentials / Client ID for Web application -> URIs
   3. Hasura allowed CORS origins
   4. Actions Service CORS origins
   5. Actions Service/Companion subservice CORS origins
   6. Auth0 Application allowed redirect URIs
3. Restart the realtime and actions services
   - If self-hosting Hasura GQL engine, restart it too.
4. Set up a CNAME record to direct the custom domain at app.clowdr.org

TODO: This step by step setup and the underlying implementation need testing
