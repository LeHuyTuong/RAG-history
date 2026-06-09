# Auth Context

Authentication and token lifecycle feature. Keep controllers, service interface, service implementation, repositories, entities, and feature DTOs in this package according to project rules.

Current implementation is aligned with the physical schema:
- Accounts are stored in separate `admin` and `member` tables.
- Login uses email/password through Spring Security. Admin lookup is attempted before member lookup, matching `CustomUserDetailsService`.
- Register creates a `member` account only. Request `name` maps to `member.full_name`; `username` is optional and generated from email when omitted.
- Access JWTs are HS512 signed and include `userId`, `accountType`, and `roles`.
- Refresh JWTs are HS512 signed, returned in the response body, also set as an HttpOnly cookie, and only their SHA-256 hash is stored in `refresh_token.token_hash`.
- `refresh_token` can belong to either `admin_id` or `member_id`; refresh rotates the token and revokes the old row.
