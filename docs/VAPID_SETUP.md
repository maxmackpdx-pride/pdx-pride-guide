# VAPID Keys — Railway Setup

Generate once (do not commit private key):

```bash
npx web-push generate-vapid-keys
```

Add to Railway project environment:

```
VAPID_PUBLIC_KEY=<public key from command>
VAPID_PRIVATE_KEY=<private key from command>
VAPID_SUBJECT=mailto:hello@pdxprideguide.com
```

Optional:

```
PUBLIC_SITE_URL=https://www.prideguidepdx.com
```

After deploy:

1. Log in as admin on production
2. Dashboard → Enable push on this device
3. `POST /api/push/test` (admin session) or send yourself an inbox message

Push is gracefully skipped when keys are missing — inbox still works.