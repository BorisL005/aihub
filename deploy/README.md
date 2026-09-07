# deploy/

The entire IaC (ARCHITECTURE.md §2), provisioned by KAN-12:

- `cloud-init.yaml` - installs Docker Engine + the Compose plugin on a fresh Hetzner node. Nothing
  else - the deploy key's public half is already in `authorized_keys`.
- `docker-compose.yml` - three services (`app`, `db`, `caddy`); see the file's own header comment
  for the invocation contract (`--project-directory` and why `env_file`/volume paths are prefixed
  `deploy/`).
- `Caddyfile` - reverse proxy + automatic HTTPS for `api.pi-console.org`.
- `.env.example` - documents every key `deploy/.env` must supply on the server. `deploy/.env`
  itself is never committed and the deploy workflow (`.github/workflows/deploy-staging.yml`)
  never syncs or overwrites it.
- `scripts/` - static checks against the files above (`node --test`), run in CI by
  `.github/workflows/deploy-config-test.yml`.

The staging hostname is `api.pi-console.org` - see below, this differs from the
`staging.aihub.dev` placeholder still sitting in `r2-cors.json` and `api/openapi.yaml`.

## r2-cors.json

CORS policy for the R2 bucket used by capture uploads (KAN-5, `POST /media/upload-url`'s
presigned PUT). The client uploads image bytes straight to R2 from the browser/Expo-web origin,
so the bucket must allow a cross-origin `PUT` from wherever the client runs; native iOS/Android
builds aren't subject to CORS at all, only the browser-hosted Expo targets are.

`staging.aihub.dev` / `app.aihub.dev` are placeholders - real hostnames aren't provisioned yet
(same gap as `api/openapi.yaml`'s `servers` block). Update both files together once the infra
ticket assigns real domains.

Apply with:

```
aws s3api put-bucket-cors --bucket <bucket> --cors-configuration file://r2-cors.json \
  --endpoint-url "$R2_ENDPOINT"
```
