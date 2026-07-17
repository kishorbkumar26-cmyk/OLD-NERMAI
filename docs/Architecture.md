# UNISTRIX Architecture

UNISTRIX is built on a **Modular Monolith** architecture. This pattern offers the simplicity and deployment ease of a monolith while strictly enforcing the domain boundaries required to scale horizontally or extract into microservices in the future.

## Directory Structure

```text
backend/
├── config/             # Centralized environment, firebase, and redis configuration
├── core/               # Shared logic, utilities, types, middleware, and queues
│   ├── errors/         # Global AppError class
│   ├── middleware/     # Auth, error handling
│   ├── logger/         # Winston logger configuration
│   └── types/          # Cross-cutting interfaces (e.g. BaseAuditFields)
├── modules/            # Domain-driven features
│   ├── auth/           # Authentication domain
│   ├── students/       # Student management domain
│   ├── courses/        # Course catalog domain
│   └── [feature]/      # Self-contained feature folder
├── scripts/            # CLI utilities and module generators
└── tests/              # End-to-end and integration test suites
```

## Core Principles

1. **Self-Contained Modules**: A module MUST define its own routes, controllers, services, repositories, schemas, and types.
2. **Public API Contracts**: Modules may ONLY export functionality through their `index.ts`. Other modules may NOT reach directly into a module's internal files.
3. **No Circular Dependencies**: Domain dependencies flow downwards. Complex cross-domain features should be extracted into shared core abstractions or orchestrated by an upper-level layer.
4. **Unified Error Handling**: Errors must be thrown as `AppError` and caught by the global error handler middleware. Do NOT send raw `res.status(500)` in a controller.
