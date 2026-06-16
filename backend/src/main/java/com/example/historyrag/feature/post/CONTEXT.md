# Post Context

Post is the CMS article feature for Vietnamese history content.

## Current Behavior
- Admin-only CRUD API is exposed at `/api/v1/admin/posts`.
- List uses `PostFilterRequest` + `Pageable` and returns `ResultPaginationDTO`.
- Create uses the current admin from JWT claim `userId`; clients do not send `adminId`.
- `PostStatus` values are `DRAFT`, `PUBLISHED`, and `ARCHIVED`.
- If a post is created or updated as `PUBLISHED` without `publishedAt`, the service sets it to the current time.
- Optional relationships:
  - `eventId` links one main `Event`.
  - `tagIds` replaces the post's tag list through the existing `post_tag` join table.

## Notes
- Do not expose `Post` entities directly from controllers.
- Keep filtering in `PostSpecification` using Spring Data JPA `PredicateSpecification`.
- Keyword filtering casts searchable fields before `ilike` so MySQL `TEXT`/`LONGTEXT` fields do not hit Hibernate CLOB `lower()` type errors.
- Schema already exists in Flyway V1; add migrations only for future schema changes.
