# Project Status

> Last updated: 2026-06-18 | By: Codex | Session: #12
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
- Added admin dashboard management: secured `GET /api/v1/dashboard`, direct Spring Data JPA repository counts/DTOs, frontend dashboard API integration with demo fallback, and dashboard unit/controller tests.
- Replaced dashboard post/engagement status string constants with `PostStatus`, `EngagementType`, and `CommentStatus` enums across entities, repositories, service, and tests.
- Fixed stale auth test fixtures for enum status DTOs and replaced Lombok constructor use in `MemberServiceImpl` with explicit constructor injection so backend tests compile.
- Added `V2__sample_data.sql` with 20 sample rows per schema table for local development, preserving the existing 8 default `system_settings` rows from V1.
- Aligned Hibernate LOB entity mappings with MySQL `TEXT`/`LONGTEXT` columns so `JPA_DDL_AUTO=validate` can start against the existing schema.
- Added explicit method-security access-denied handling so admin-only endpoints return 403 instead of falling through to 500.
- Hardened Docker startup by adding a MySQL healthcheck, making backend wait for healthy MySQL, and allowing `/actuator/health` through security.
- Standardized all feature entities on Lombok `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, and `@Builder`; configured Maven annotation processing with Lombok 1.18.46 so Docker backend builds on Java 25.
- Centralized mutable entity audit fields in `BaseEntity` with Hibernate creation/update timestamps; removed audit `@ColumnDefault`, kept `RefreshToken` creation-only, and added `tag.updated_at` via Flyway migration.
- Enabled Flyway migrations for the backend, defaulted JPA DDL to `validate`, and adjusted cloud Docker env so TiDB Cloud runs without waiting for local MySQL.
- Made the initial post full-text indexes TiDB-compatible in `V1__init.sql` by splitting title, summary, and content into separate single-column indexes; verified Flyway V1-V3 migrations plus Hibernate validation against TiDB Cloud.
- Fixed login refresh-token persistence by removing premature Bean Validation from Hibernate-managed `RefreshToken.createdAt`.
- Added admin CRUD Post backend API with ResultPaginationDTO filtering, JWT admin author resolution, Post-Tag mapping, service/controller tests, and API docs.
- Fixed post keyword filtering by casting searchable fields before `ilike`, avoiding Hibernate CLOB `lower()` errors on `summary` and `content`.
- Added admin CRUD Location backend API with enum location types, ResultPaginationDTO filtering, validation, service/controller tests, and API docs.
- Added admin CRUD Source backend API with source/reliability enums, ResultPaginationDTO filtering, validation, service/controller tests, and API docs.

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
