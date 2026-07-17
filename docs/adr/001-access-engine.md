# ADR 001: Access Engine & Visibility Evaluation

## Status
Accepted

## Context
NERMAI Academy hosts highly sensitive, commercial educational material across diverse user cohorts (Batches, Programs, Guest Students). Traditional Role-Based Access Control (RBAC) was insufficient because a student's access depends not just on their `role='student'`, but dynamically on:
- Batch membership (`batch43`, `LDC2026`)
- Program enrollment tiers
- The specific visibility settings of individual resources (e.g., `visibility: 'batch'` vs `visibility: 'public'`).

## Decision
We implemented a dynamic, context-aware `AccessEngine` backed by Redis and Firebase Auth JWTs. 

1. **JWT Optimization**: We keep Firebase JWTs lightweight by injecting only a `membershipVersion` instead of unbounded arrays of batch IDs, saving bandwidth on every request.
2. **Redis Context Cache**: A complete `AccessContext` (Batch IDs, Programs, Roles) is hydrated from Firestore and cached in Redis upon login or token refresh, keyed as `access:user123`.
3. **AccessEngine**: A dedicated authorization layer intercepts requests, pulls the `AccessContext` from Redis, and evaluates it against the requested Resource's visibility constraints (e.g., checking intersection of the student's `batchIds` against the resource's `targetBatchIds`).

## Consequences
- **Positive**: Extremely fast authorization checks (microseconds) without incurring expensive Firestore reads per request. Total separation of authentication from business-logic authorization.
- **Negative**: Adds architectural complexity; requires explicit invalidation of the Redis cache when an admin updates a student's batch access.
