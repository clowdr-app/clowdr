# Notes about Ngrok

## Configuring an HTTPS (SSl/TLS) Ngrok Wildcard white label domain for use as the target of an Auth0 custom rule

You may have tried to use an Ngrok wildcard domain as the target of a call from an Auth0 custom rule.
If you're reading this, you probably hit this brickwall of error: `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
and didn't want to do the very dangerous **thing you should never do**: `NODE_TLS_REJECT_UNAUTHORIZED`.

1. Get a wildcard SSL cert using `certbot` and Let's Encrypt:
   1. Download/install certbot for your platform
      - They don't make the installers easy to find - trawl through certbot's getting started instructions till you find the download link.
   1. Open an administator command prompt
   1. Run `certbot -d *.your.domain.org --manual --preferred-challenges dns certonly`
   1. Enter your information if/as required
   1. Follow instructions for creating the TXT record
   1. Validate the TXT record using [MXToolbox](https://mxtoolbox.com/)
   1. Wait at least 5 mins, if not longer, after MXToolbox reports everything ok (certbot isn't as fast at updating!)
   1. Now continue
   1. If everything worked, it should now tell you where your certificate files are saved
      - If not, try again and wait longer after updating the TXT record.
      - Also try reducing the TXT record expiry time.
1. Go into the Ngrok configuration
1. Under endpoints, add your white label domain:
   1. At the time of writing, the following instructions for SSL certs relies on Beta features of the Ngrok service.
   1. Click `Reserve a domain`
   1. Pick your region
   1. Enter your wildcard domain `*.your.domain.org`
   1. Choose `Use an uploaded certificate`
   1. `TLS Certificate`: Upload `fullchain1.pem` - **NOT** just the `cert.pem`
      - You need the full chain uploaded otherwise Auth0 will give you that
        opaque `UNABLE_TO_VERIFY_LEAF_SIGNATURE` error, even when your web
        browser reports the certificate as being ok. This is because NodeJS
        doesn't download certificate chains when validating certificates of
        web requests it issues. By uploading the full chain file, you make
        the whole chain available to NodeJS in the single certificate response.
   1. `Private key`: Upload `privkey.pem`
   1. Click save
   1. Follow instructions for creating your CNAME
1. Now you can create permalinks (for your tunnels) and use them within Auth0 rules :)
