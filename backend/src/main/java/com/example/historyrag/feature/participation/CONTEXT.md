# Participation Context

Admin-only management for event-person participation records.

- A Participation links one `Event` and one `Person`.
- `role` is optional and uses `ParticipationRole` enum.
- Duplicate records are rejected by the logical key `eventId + personId + role`.
- `confidence` is optional and constrained to `0.00` through `1.00`.
