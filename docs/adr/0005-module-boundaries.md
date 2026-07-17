# ADR 0005: Strict Module Boundaries

## Context
In monolithic codebases, it is extremely common for developers to start importing logic from one folder directly into another (e.g., `import { calculateScore } from '../../courses/utils'`). Over time, this creates an unmaintainable web of dependencies.

## Decision
We enforce strict **Module Boundaries**.

### Why was this decision made?
Modules must be self-contained. If a module needs functionality from another, it must consume it through the other module's public `index.ts` API. This keeps the blast radius of changes isolated to a single domain.

### What alternatives were considered?
- **Shared Utils Folder**: Rejected because domains often have conflicting definitions of the same concept. Shared logic should be promoted to `core/` only if it applies universally to the infrastructure.
- **Cross-Importing internal files**: Rejected because it violates encapsulation and breaks future microservice extraction.

## Consequences
- Encourages well-thought-out API contracts between modules.
- Developers must sometimes duplicate a small interface rather than coupling two modules together.
- Ensures absolute stability and predictability across the UNISTRIX framework.
