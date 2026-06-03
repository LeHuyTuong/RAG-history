---
name: rag-history-system
description: Work on the RAG History System project. Use when Codex needs to inspect, maintain, debug, extend, document, or evaluate this repository's RAG pipeline, retrieval logic, history-domain prompts, API/backend code, frontend integration, tests, or project documentation.
---

# RAG History System

## Overview

Use this skill for project-specific work in the RAG History System repository. Keep changes aligned with the existing architecture, history-domain behavior, and retrieval-answering workflow.

## Workflow

1. Inspect the repository structure before making assumptions.
2. Identify the part of the system involved: ingestion, embedding, vector storage, retrieval, generation, API, frontend, tests, or documentation.
3. Read nearby code and configuration before editing.
4. Keep changes scoped to the requested task.
5. Preserve existing naming, formatting, and framework conventions.
6. Run the most relevant available checks after code changes.
7. Summarize changed files, verification, and any remaining risk.

## RAG Review Checklist

When reviewing or improving RAG behavior, check:

- Whether retrieved context is relevant to the user question.
- Whether the answer is grounded in retrieved context.
- Whether citations or source references are preserved when the project supports them.
- Whether prompts prevent unsupported claims.
- Whether chunking, metadata, and filters match the history-domain use case.
- Whether failures return clear messages instead of hallucinated answers.

## Project Resources

- Put project-specific notes in `references/`.
- Put repeatable maintenance or evaluation scripts in `scripts/`.
- Put reusable prompt templates, document templates, or sample assets in `assets/`.

