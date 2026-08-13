# Security Notes

## Secrets

Real database passwords, SMTP credentials, JWT signing keys, API keys, and administrator passwords must not be committed to this repository.

Runtime secrets are read from environment variables. See `backend/.env.example` for the variable names expected by the application.

If a real credential has ever appeared in Git history, removing it from the latest commit is **not sufficient**. Treat it as compromised and rotate/revoke it at the provider.

## Administrator bootstrap

Automatic administrator creation is disabled by default.

To intentionally create an initial administrator, provide all of the following at runtime:

```text
BOOTSTRAP_ADMIN_ENABLED=true
BOOTSTRAP_ADMIN_USERNAME=<non-default username>
BOOTSTRAP_ADMIN_PASSWORD=<strong password, at least 12 characters>
BOOTSTRAP_ADMIN_EMAIL=<administrator email>
```

The application validates these values before creating the account and stores the password through the configured `PasswordEncoder`.

After the initial account has been created, disable bootstrap again.

## Deployment checklist

- Generate a long random `JWT_SECRET` for each environment.
- Use a dedicated database account with least privilege.
- Store SMTP credentials in a secret manager or runtime environment, not source control.
- Disable SQL logging in production unless explicitly required for debugging.
- Review CORS / deployment origin settings before exposing the service publicly.
- Rotate any credential that was previously committed, even if the file has since been cleaned.
