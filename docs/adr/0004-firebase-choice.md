# ADR 0004: Firebase as Primary Database and Auth

## Context
UNISTRIX required a fast-to-market database that supported real-time updates and seamless multi-platform authentication out of the box.

## Decision
We chose **Firebase (Firestore + Auth)**.

### Why was this decision made?
Firebase Auth provides immediate support for Google, Phone, and Email logins without managing salts/hashes. Firestore provides a schemaless, scalable NoSQL document store perfectly suited for rapid iteration and real-time dashboard subscriptions.

### What alternatives were considered?
- **PostgreSQL + Custom Auth**: Rejected due to higher initial setup complexity, strict migration requirements, and the need to build and maintain an auth server.
- **MongoDB**: Rejected because it lacked the built-in, tightly coupled Auth features of Firebase.

## Consequences
- Requires careful handling of NoSQL relationships and duplicate data updates.
- Limits complex aggregate queries compared to SQL.
- We mitigate this by strictly enforcing the Repository pattern (ADR 0002) so we can migrate to PostgreSQL/SQL in the future if necessary.
