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

Neither has a default in `application.yml` on purpose - see the comment there. Set both via the
process environment (Spring's relaxed binding maps `AUTH0_ISSUER_URI` → `auth0.issuer-uri`
automatically); no `application.yml` change is needed. `docker-compose.yml` (once `deploy/` is
built out) is the natural place to wire these from the deploy secrets.

## Running locally

```
AUTH0_ISSUER_URI=https://your-tenant.auth0.example/ \
AUTH0_AUDIENCE=https://api.your-tenant.example/ \
./mvnw spring-boot:run
```

Needs a reachable Postgres 17 (`spring.datasource.*`, not set here - see `application.yml`).

## Testing

Integration tests never talk to a real Auth0 tenant: `dev.aihub.support.TestJwtSupport` issues its
own signed JWTs against an in-memory key pair and overrides the `JwtDecoder` bean, validating
issuer, expiry and audience the same way `SecurityConfig` does in production. `./mvnw verify` needs
Docker (Testcontainers Postgres).
