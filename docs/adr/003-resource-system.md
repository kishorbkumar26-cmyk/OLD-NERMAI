# ADR 003: Polymorphic Resource Hierarchy

## Status
Accepted

## Context
Educational material needs to be attached to various levels of the curriculum. Some PDFs belong to an entire Course, others to a specific Topic, and others strictly to a single Class. Managing distinct collections for "Course Resources," "Topic Resources," and "Class Resources" would result in heavy code duplication and brittle queries.

## Decision
We implemented a Polymorphic Resource System with Contextual Inheritance.

1. **Unified Schema**: All resources are stored in a single `resources` collection.
2. **Flexible Attachments**: A resource document maintains arrays for `courseIds`, `subjectIds`, `topicIds`, and `classIds`.
3. **Cascading Retrieval**: When a student opens a Class, the backend queries the unified `resources` collection for any resource where `classIds` includes the current class ID, dynamically retrieving exactly what is relevant for that specific context.
4. **Security Delineation**: Resources are strictly segmented via toggles in the admin dashboard: "Secure Mode" (enforces in-app viewing, blocks downloads, requires signed URLs) versus "Downloadable Mode" (generates standard download headers).

## Consequences
- **Positive**: Extensively DRY (Don't Repeat Yourself). The same `ResourceForm` handles uploads across all LMS tiers. Search and filtering across the entire LMS is extremely fast.
- **Negative**: Array-based queries (`array-contains-any`) in Firestore are fast but require careful index management if filtering by multiple fields simultaneously.
