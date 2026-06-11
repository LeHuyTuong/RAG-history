# Admin Context

Administrative feature. Keep controllers, service interface, service implementation, repositories, entities, and feature DTOs in this package according to project rules.

## Dashboard
- `GET /api/v1/dashboard` is an admin-only summary endpoint.
- Dashboard metrics use Spring Data JPA repository methods: built-in `count()` plus derived `countBy...` methods.
- `AdminDashboardServiceImpl` injects the related repositories directly and assembles the dashboard response.
- The service reads aggregate counts only; it does not create or mutate dashboard state.
- Comment moderation numbers are derived from `engagement_type = COMMENT` and `comment_status` values `PENDING`, `VISIBLE`, and `HIDDEN`.
- Post status cards are derived from string status values `PUBLISHED`, `DRAFT`, and `ARCHIVED`.
