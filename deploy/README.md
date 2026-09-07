# deploy/

The entire IaC (ARCHITECTURE.md §2): `docker-compose.yml`, cloud-init, Caddyfile. Empty until the
infra ticket that provisions the VPS lands.

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
