# Event Context

Admin-only management for historical events.

Important behavior:
- `Event` stores core historical timeline fields and an optional `Period`.
- `certaintyLevel` is an enum: `CERTAIN`, `ESTIMATED`, `DISPUTED`.
- `locationRelations` manages the existing `event_location` join table and preserves its `relation_type` value.
- Create/update replaces the full location relation list for an event.
- Source links and person participations are managed by their own feature modules.
- Delete relies on database FK behavior for `event_location`, `participation`, `event_source`, and `post.event_id`; RAG chunk/Qdrant cleanup is deferred.
