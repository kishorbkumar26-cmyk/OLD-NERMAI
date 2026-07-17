# ADR 0002: Repository Pattern

## Context
Modules need to query and mutate data. Directly coupling business logic to Firestore SDKs makes the system difficult to test and ties the framework to a single database technology.

## Decision
We mandate the **Repository Pattern** for all data access.

### Why was this decision made?
Repositories provide an abstraction layer over the database. Services interact with Repositories using plain TypeScript objects (`IStudent`, `ICourse`).

### What alternatives were considered?
- **Active Record**: Rejected because it mixes data access with business logic, violating Single Responsibility.
- **Direct Database Calls in Services**: Rejected because it prevents unit testing and locks the architecture to Firestore.

## Consequences
- Services are decoupled from Firestore.
- We can seamlessly implement a lightweight Dependency Injection system where Repositories are passed to Services via constructors.
- Adding in-memory repositories for blazing fast unit testing is straightforward.
