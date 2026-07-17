# ADR 0001: Modular Monolith

## Context
As the UNISTRIX platform scales, we need an architecture that supports complex domain logic without the overhead of managing distributed systems.

## Decision
We adopted the **Modular Monolith** architecture.

### Why was this decision made?
A modular monolith provides the best of both worlds: the strict isolation of microservices with the deployment simplicity of a traditional monolith. It reduces dev-ops complexity, eliminates network latency between internal domains, and simplifies transactions and state management.

### What alternatives were considered?
- **Microservices**: Rejected due to high operational overhead, complex debugging, and unnecessary network boundary serialization at this stage.
- **Traditional Layered Monolith (MVC)**: Rejected because grouping by technical concern (`controllers/`, `models/`) inevitably leads to tightly coupled spaghetti code as the business logic grows.

## Consequences
- Requires extreme discipline to maintain module boundaries.
- Future microservice extraction becomes trivial if a specific module needs to scale independently.
