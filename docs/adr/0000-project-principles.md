# ADR 0000: Project Principles

## Decision
Establish the fundamental architectural principles for the UNISTRIX Backend Framework. Every new developer joining a UNISTRIX project must read and adhere to these guidelines.

## Principles

1. **Modular Monolith**: We favor building isolated domain modules within a single deployment artifact over prematurely extracting independent microservices.
2. **Feature-First Organization**: Code is grouped by business feature (e.g., `modules/students`, `modules/courses`) rather than technical type (e.g., `controllers/`, `services/`).
3. **Repository Pattern**: All database interactions must be abstracted behind a Repository class. Business logic should never call database SDKs directly.
4. **No Cross-Module Implementation Imports**: Modules must not import internal files from other modules. They may only import from a sibling module's root `index.ts`.
5. **Public API via `index.ts`**: Every module's `index.ts` serves as its public contract. Export only what other modules explicitly need.
6. **Business Logic Never in Routes**: Route files are solely for HTTP method mapping and middleware registration.
7. **Business Logic Never in Controllers**: Controllers are strictly for extracting HTTP requests, calling the Service layer, and formatting HTTP responses.
8. **Infrastructure Isolation**: External adapters (Firebase, Redis, Queues, Email, Storage) live in `backend/infrastructure/` and are injected or imported into Repositories/Services.

## Consequences
- High maintainability and readability for large teams.
- Strict boundaries prevent "spaghetti code."
- Ensures an easy transition if a domain must be extracted into a separate microservice.
