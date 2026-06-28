# Source Context

Source management stores historical evidence records used by event citations and future RAG ingestion.
Admin CRUD lives under `/api/v1/admin/sources` and uses DTOs instead of exposing the entity.

## Current Behavior
- `SourceType` values are `BOOK`, `ARTICLE`, `PDF`, `URL`, and `MANUAL`.
- `ReliabilityLevel` values are `HIGH`, `MEDIUM`, and `LOW`.
- List uses `SourceFilterRequest` + `Pageable` and returns `ResultPaginationDTO`.
- Delete is CRUD-only: `event_source` rows cascade through the database FK; `rag_chunk` and Qdrant cleanup are deferred to the RAG lifecycle feature.
