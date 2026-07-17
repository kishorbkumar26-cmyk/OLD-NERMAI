# UNISTRIX Backend Architecture Standard (v1.0)

## Objective
Transform the backend into a scalable, loosely coupled Modular Monolith where every feature is self-contained, independently maintainable, and can be extracted into a microservice in the future with minimal effort.

The priority is architectural correctness, module isolation, and long-term maintainability, not simply achieving a successful TypeScript build.

## Phase 1 — Freeze the Architecture

No code fixes should be performed during this phase.

### Verify Folder Structure
Confirm that every business feature exists under:
```text
backend/
│
├── core/
├── shared/              (if available)
├── infrastructure/      (if available)
├── config/              (if available)
└── modules/
```

Each feature should be independent.

Example:
```text
modules/
  students/
  courses/
  videos/
  attendance/
  live-classes/
  resources/
  dashboard/
  chatbot/
  faq/
  auth/
```

### Verify Module Contents
Every feature should contain only its own implementation.

Minimum recommended structure:
```text
students/
  controller.ts
  service.ts
  repository.ts
  routes.ts
  dto.ts
  validator.ts
  constants.ts
  types.ts
  index.ts
```

Optional:
* `permissions.ts`
* `events.ts`
* `tests/`

Do not create empty placeholder files simply to satisfy this structure. Include files only where the feature genuinely requires them.

### Remove Legacy Structure
Verify that there are no remaining legacy folders such as:
* `backend/admin/`
* `backend/student/`
* `backend/controllers/`
* `backend/routes/admin/`
* `backend/routes/student/`

No legacy implementation should remain.

### Verify Routing
The application router should import only the module's public API.

**Preferred:**
```typescript
import StudentsModule from "../modules/students";
```

**Avoid:**
```typescript
import routes from "../modules/students/routes";
import controller from "../modules/students/controller";
```

Each module should expose its public API through `index.ts`.

## Phase 2 — Validate Module Boundaries

This phase is more important than compilation.
Modules must remain loosely coupled.

### Disallow Internal Imports

**Avoid:**
```typescript
import StudentService from "../students/service";
```

**Prefer:**
```typescript
import { StudentService } from "../students";
```
or communicate through interfaces/events when appropriate.

A module should never rely on another module's private implementation.

### Shared Code
Move only truly reusable code into `shared/`:
* `middleware/`
* `logger/`
* `errors/`
* `validators/`
* `utils/`
* `types/`
* `constants/`
* `events/`

**Never move business logic into shared.**

### Repository Layer
Business logic must never communicate directly with Firestore, SQL, or external APIs.

Always maintain the flow:
`Controller` -> `Service` -> `Repository` -> `Database / External API`

This keeps persistence replaceable.

## Phase 3 — Architectural Validation

Before fixing compiler errors, verify:
* No circular dependencies
* No duplicate business logic
* No cross-module implementation imports
* Every module exports only through `index.ts`
* No direct database access from controllers
* No business logic inside route files
* No utility dumping into shared

Only after these checks pass should compilation begin.

## Phase 4 — Compile

Run: `npx tsc --noEmit`
Generate a report grouped by module. Do not fix anything during this reporting phase.

## Phase 5 — Module-by-Module Repair

Never execute a global cleanup.
Repair one module at a time.

**Rules:**
1. Modify only the current module.
2. Do not introduce temporary workarounds.
3. Do not modify unrelated modules.
4. Keep architectural boundaries intact.
5. Ensure the module compiles cleanly before moving to the next.

## Phase 6 — Runtime Verification

After each repaired module:
* Verify routing
* Verify API responses
* Verify middleware
* Verify authorization
* Verify repository calls
* Verify database interactions

Compilation success alone is not sufficient.

## Architectural Rules (Permanent)

Every future UNISTRIX backend project should follow these principles:

1. **One business capability = one module.**
2. Each module owns its controller, service, repository, routes, DTOs, validators, constants, types, and tests.
3. Business logic never depends directly on Express, Firebase, or database implementations.
4. Modules communicate only through public APIs, interfaces, or events.
5. `shared/` contains only cross-cutting infrastructure, never business logic.
6. Every module exposes a single public entry point (`index.ts`).
7. Design each module so it can be extracted into an independent microservice with minimal changes.
8. Prefer business-capability modules (students, courses, payments) over role-based modules (admin, student). Roles belong in authorization and routing, not in the architecture.


## Phase 5 Rules (UNISTRIX Standard)

**Rule 1 — One Module Only**
Only repair the current module. If another module requires changes, stop and report it instead of modifying it.

**Exception:** If a repair reveals that a type, interface, constant, or utility has been incorrectly placed inside a feature module but is clearly application-wide, it may be moved into core/ (or shared/, depending on ownership). This architectural correction is permitted, provided no business logic is moved and all affected imports are updated.

**Rule 2 — No Architectural Changes**
Do not rename folders. Do not move files. Do not introduce new shared abstractions. The architecture is frozen. Only repair compilation and runtime issues.

**Rule 3 — Preserve Public APIs**
Every module's `index.ts` is now considered its public contract. Do not change exported APIs unless absolutely required.

**Rule 4 — Repository Pattern**
Never bypass the repository.
Forbidden: `Controller -> Firestore`
Correct: `Controller -> Service -> Repository -> Firestore`

**Rule 5 — Zero Cross-Module Internal Imports**
Forbidden: `import CourseService from "../courses/service";`
Allowed: `import { CourseService } from "../courses";`

**Rule 6 — Fix Root Causes**
Do not suppress errors using `any`, `@ts-ignore`, `!`, or temporary casts. Every fix should address the actual cause.

**Rule 7 — Compile After Every Module**
After completing a module: `npx tsc --noEmit`. Report before/after errors.

**Rule 8 — Runtime Verification**
For every repaired module verify: Routes, Middleware, Validation, Repository calls, Responses.

**Rule 9 — No Hidden Refactoring**
If fixing module A exposes an issue in module B, report it for the Module B phase.

**Rule 10 — Completion Report**
At the end of every module, provide a concise report outlining errors before/after, files modified, architecture compliance, and runtime verification.
