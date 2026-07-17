# ADR 0003: Redis Fail-Fast Startup

## Context
Redis is used for caching, rate limiting, and background queues (BullMQ). If Redis is offline, the backend could technically fall back to database queries.

## Decision
We enforce a fail-fast startup behavior if `REDIS_REQUIRED=true` (Production standard).

### Why was this decision made?
In production, running without Redis triggers catastrophic database load (thundering herd problem) and silently drops background jobs. It is safer to crash the application container `process.exit(1)` and let the orchestration layer (e.g., Kubernetes) handle it, rather than allowing a degraded state to cripple the entire infrastructure.

### What alternatives were considered?
- **Silent Degradation**: Rejected because it masks critical infrastructure failures until a database outage occurs.
- **In-Memory Fallback**: Rejected because it breaks horizontal scaling state (queues, rate limits).

## Consequences
- Requires strict environment variable management.
- Guarantees predictable performance in production.
- Developers can still set `REDIS_REQUIRED=false` to work offline locally.
