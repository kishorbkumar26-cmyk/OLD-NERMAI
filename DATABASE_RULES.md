# Database Rules

DO NOT:

- Remove collections
- Rename fields
- Change schema
- Break compatibility

Allowed:

- Add new optional fields
- Add new collections

Must include:

createdAt
updatedAt
createdBy
updatedBy
isDeleted
deletedAt
deletedBy

for all collections.

Indexes mandatory:

- studentId + createdAt
- videoId + studentId
- classId + createdAt
- conversationId + createdAt