# AI Hub backend

Java 21, Spring Boot 4.1, jOOQ, Flyway. See `../ARCHITECTURE.md` and `../.claude/skills/spring-conventions` before changing anything here.

## Required configuration

The app **will not start** without these - `dev.aihub.security.SecurityConfig` only registers a
`JwtDecoder` bean when `auth0.issuer-uri` is set, and that bean requires `auth0.audience` too; with
no decoder bean, Spring Security's resource-server wiring fails fast at startup rather than
silently accepting unvalidated tokens.

| Environment variable | Property | Purpose |
|---|---|---|
| `AUTH0_ISSUER_URI` | `auth0.issuer-uri` | The Auth0 tenant's issuer URL (e.g. `https://your-tenant.auth0.eu/`). Used both to fetch the JWKS for signature verification and to pin the `iss` claim. |
| `AUTH0_AUDIENCE` | `auth0.audience` | The API identifier configured in the Auth0 dashboard for this API. Validated against the token's `aud` claim - without this, a token minted for a *different* API in the same Auth0 tenant would otherwise pass (same issuer, valid signature). |

Same fail-fast shape for capture media (KAN-5): `dev.aihub.ingestion.MediaStorageConfig` only
registers an `ObjectStorageClient` bean when `r2.endpoint` is set, and the endpoints that need it
(`POST /media/upload-url`, `POST .../entries`) would otherwise fail to wire at startup.

| Environment variable | Property | Purpose |
|---|---|---|
| `R2_ENDPOINT` | `r2.endpoint` | The R2 account's S3-compatible endpoint URL. Same variable name as the `receipt-eval-sync-validate` CI job (KAN-10) - different bucket, same account. |
| `R2_BUCKET` | `r2.bucket` | The bucket capture media is stored in. |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | `r2.access-key-id` / `r2.secret-access-key` | R2 API token credentials, scoped to `R2_BUCKET`. |

None of the above has a default in `application.yml` on purpose - see the comment there. Set them
all via the process environment (Spring's relaxed binding maps `AUTH0_ISSUER_URI` →
`auth0.issuer-uri`, `R2_ENDPOINT` → `r2.endpoint`, etc. automatically); no `application.yml`
change is needed. `docker-compose.yml` (once `deploy/` is built out) is the natural place to wire
these from the deploy secrets.

## Running locally

```
AUTH0_ISSUER_URI=https://your-tenant.auth0.example/ \
AUTH0_AUDIENCE=https://api.your-tenant.example/ \
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com \
R2_BUCKET=aihub-media \
R2_ACCESS_KEY_ID=... \
R2_SECRET_ACCESS_KEY=... \
./mvnw spring-boot:run
```

Needs a reachable Postgres 17 (`spring.datasource.*`, not set here - see `application.yml`).

## Testing

Integration tests never talk to a real Auth0 tenant: `dev.aihub.support.TestJwtSupport` issues its
own signed JWTs against an in-memory key pair and overrides the `JwtDecoder` bean, validating
issuer, expiry and audience the same way `SecurityConfig` does in production. Likewise, no test
talks to real R2: `dev.aihub.support.FakeObjectStorageClient` is an in-memory `ObjectStorageClient`
double, overriding `MediaStorageConfig`'s bean. `./mvnw verify` needs Docker (Testcontainers
Postgres).
