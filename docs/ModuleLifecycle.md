# Module Lifecycle

Every new module introduced to the UNISTRIX framework MUST follow this standard lifecycle before being merged into the codebase.

## Definition of Done (Module Checklist)

- [ ] **Module generated using CLI** (`npx tsx scripts/generate-module.ts <name>`)
- [ ] **README.md** created with Purpose, Public APIs, and Dependencies
- [ ] **Routes registered** in `app.ts` under `/api/v1/<name>`
- [ ] **Repository implemented** extending `BaseRepository`
- [ ] **DTO validation added** (e.g., using Zod for payload validation)
- [ ] **Authorization implemented** using `requireRole` or `requireAuth`
- [ ] **Integration tests written** covering at least happy-path integration
- [ ] **Documentation updated** (e.g. `AuthorizationMatrix.md` if new endpoints exist)
- [ ] **CI passes** (Type check, linting, testing)
- [ ] **Code review completed**
