# Admin Context

Administrative feature. Keep controllers, service interface, service implementation, repositories, entities, and feature DTOs in this package according to project rules.

## Dashboard
- `GET /api/v1/dashboard` is an admin-only summary endpoint.
- Dashboard metrics are exposed by feature service interfaces, backed by Spring Data JPA repository count methods.
- `AdminDashboardServiceImpl` injects related feature services and assembles the dashboard response.
- The service reads aggregate counts only; it does not create or mutate dashboard state.
- Comment moderation numbers are derived from `EngagementType.COMMENT` and `CommentStatus` values.
- Post status cards are derived from `PostStatus` values.

## System Settings
- `GET /api/v1/admin/settings` and `GET /api/v1/admin/settings/{key}` expose runtime settings used by the admin settings screen.
- `PUT /api/v1/admin/settings/{key}` is the only admin-only mutation.
- The admin UI currently manages exactly three keys: `rag.llm_model`, `ui.logo_url`, and `ui.background_url`.
- `ui.logo_url` and `ui.background_url` are shared by both user and admin layouts.
- Do not store secrets/API keys in `system_settings` while settings GET endpoints are readable by the frontend.
