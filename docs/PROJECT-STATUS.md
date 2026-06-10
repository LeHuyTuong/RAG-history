# Project Status

>
> AI: update this file at the end of every session when asked.
> Follow this exact format. Keep it concise — under 80 lines.

---

## Completed
- Created `docs/25-physical-erd.md` for History RAG physical ERD based on docs 22, 23, and `V1__init.sql`.
- Migrated backend build stack to Java 25, Spring Boot 4.0.6, Boot 4 Web MVC/WebClient starters, Spring Security OAuth2 resource server, and SpringDoc OpenAPI 3.0.3.
- Added the Spring Boot application entrypoint so Maven package and Docker build can repackage an executable backend jar.
- Reworked backend scaffold to match `.codex-rules/project-rules.md`: top-level `config`, `security`, `exception`, `dto`, `feature`, `infrastructure`, and `util`; feature DTO folders and `CONTEXT.md` files added.
- Updated `CustomUserDetailsService` to authenticate against separate `admin` and `member` tables with fixed `ROLE_ADMIN` and `ROLE_USER` authorities.
- Reworked JWT authentication to match the current `admin`, `member`, and `refresh_token` schema while preserving login/register/refresh/logout/me flow and refresh-token cookie/body strategy.
- Added unit and standalone MVC tests for the auth feature covering register, login, refresh rotation, logout, `/me`, validation, duplicate email, and missing refresh token cases.
- Aligned Docker backend JWT environment variables on `JWT_SECRET_KEY` and removed the hardcoded JWT secret fallback from `application.yml`.

## In Progress
_Nothing._

## Deferred Issues
## Next Tasks

## Milestones

### Phase 0 — Foundation

### Phase 1 — Independent Entities


### Phase 2 — Role (depends on Permission)

### Phase 3 — User (depends on Role + Company)


### Phase 4 — Authentication


### Phase 5 — Refresh Token (ADR-001)


### Phase 6 — File Upload (ADR-002)


### Phase 7 — RBAC

### Phase 8 — Polish
