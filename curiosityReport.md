# Curiosity Report: Formal Verification in DevOps

## Preamble: Why I care

In my research with Kimball Germaine, I am currently building an abstract interpretater (one particular formal verification technique).
However, I haven't seen (or even heard of) formal verification being used much in practice oustide of extreme examples. (Fighter jet
safety systems don't seem very representative of software as a whole.)

I'm of the opinion that formal verification will likely become far more widespread as AI grows, but I wasn't sure what it would
look like to deploy it at scale. So for my curiosity report, I chose to investigate formal verification techniques from a DevOps
perspective.

## Introduction

A central problem in software engineering is determining how to guarantee that software meets its own specifications:
*software verification*. The most common form of verification is testing, but unit, integration, and even chaos tests
only provide guarantees about a small subset of possible executions.

*Formal verification* addresses this limitation by analyzing programs or formal models of programs to prove properties that
hold for all possible executions within the model or specification. Instead of validating individual cases, verification
methods reason about the structure and semantics of code to produce stronger correctness guarantees. This approach is
particularly important in security-critical, financial, or safety-critical systems.

Even common development tools provide limited forms of verification. Static type systems guarantee at compile-time that
certain type errors cannot occur within the type-system's scope, and input validation attempts to ensure that external
data conforms to expected formats before reaching application logic.

## What's wrong with testing?

Formal verification and software testing make different kinds of guarantees about program behavior.

Software tests--from unit tests to chaos gorillas--provide evidence of correctness by checking the exact result of a specific
execution. For instance, a unit test might confirm that `square(5)` returns `25`, but it provides no assurance about other inputs.

Formal verification instead proves general properties of program behavior, such as that `square(n) >= n` for every positive integer.
A system might verify protocol properties such as "a function must be called exactly once per request," or that sensitive data sources
can never influence public outputs, or that a module never accesses protected resources.

In practice, robust systems combine both approaches: testing verifies concrete behavior, while verification ensures broader
invariants hold.

## Major verification techniques

### Model checking (shout out to Dr. Mercer)

Model checking constructs an abstract model of a system and systematically explores all possible states of that model.
Because the model is simpler than the full implementation, exhaustive exploration becomes feasible. If the model faithfully
captures the relevant behavior of the system, verified properties may carry over to the real implementation. When violations
occur, model checkers can produce counterexamples showing the sequence of states that breaks a property, so the engineers
know where the problem lies.

### Bounded model checking

Bounded model checking verifies program properties by exploring executions only up to a fixed depth. The program’s behavior
for a limited number of steps is encoded as a logical formula and passed to a SAT or SMT solver, which determines whether
a counterexample exists within that bound. This is often far more tractable than exhaustive model checking and works well
in automated pipelines for detecting bugs in short execution paths. However, its guarantees are limited, since proving that
no violation exists within the bound does not ensure correctness beyond that bound.

### Abstract interpretation (shoutout to Dr. Germaine)

An abstract interpreter analyzes programs using sound overapproximations of possible variable values during execution.
While tracking every possible value is infeasible in practice, cleverly designed approximations can still prove properties
such as:

- variables always remain within safe bounds
- functions only receive inputs that are guaranteed valid
- certain error states cannot occur

### Symbolic execution

Symbolic execution analyzes programs by running them with symbolic inputs rather than concrete values. As execution proceeds,
the system records logical constraints that describe which inputs lead to each possible execution path. SMT solvers can then
determine whether those paths are feasible and generate concrete inputs that reproduce them. This makes symbolic execution
useful for discovering edge cases and generating high-coverage tests automatically. In practice, however, the number of
possible paths can grow exponentially, so tools often rely on heuristics and hybrid approaches to control this path explosion.

### Advanced type systems

Some languages encode deeper guarantees directly in the type system. For example, Rust’s ownership model and borrow checker
enforce strict memory rules that prevent data races and many classes of memory errors if the program compiles successfully.
As an extreme example, Lean's dependent type system is powerful enough to encode proofs of nearly arbitrary logical statements,
leading to its use as a general theorem prover in formal mathematics.

## Verification in DevOps pipelines

Formal verification can be integrated into CI/CD pipelines similarly to automated testing: by making it a first-class citizen
in the build pipeline.

In this workflow:

- developers commit code, specifications, and policies together
- verification tools (model checkers, solvers, interpreters) run during CI
- proof artifacts and verification results are treated as build artifacts--compiled, built, and versioned along with the code
- if a specification is violated, the build fails

This shifts development toward specification-driven engineering, where developers implement both the system and the constraints
it must satisfy in parallel. In this sense, TDD can be viewed almost as a lightweight form of spec-driven development.

## Limitations

### Scalability

In practice, formal verification can be difficult to scale. Proofs often break when code changes, and verifying proofs is often
computationally expensive--exhaustive model checking for example may require exploring extremely large state spaces.
As a result, most organizations verify only critical or security-sensitive components, and employ techniques like proof
caching to avoid recomputation.

To improve scalability, systems typically use modular verification contracts, where components specify assumptions about
other components and guarantees about their own behavior. This means guarantees are predicated on the assumptions specified
in each module's interface, but if interfaces are relatively stable, it limits the scope of proof updates when code evolves.

### Model assumptions

Every formal verification technique has built-in assumptions, and the guarantees they provide are only as good as those assumptions.
A model checker is only useful if the model is accurate, and an abstract interpreter can only give you weak guarantees if its
approximations paint over the behavior you care about. Given the time, however, nearly all these techniques can be adjusted
to match the precision and accuracy required.

## Implications for AI-generated code

AI-generated code introduces additional risk: models may produce implementations that satisfy test cases but violate broader
system policies. Because tests cover only limited execution paths, they may miss these violations. Formal verification provides
stronger guarantees by enforcing global invariants and policy constraints, independent of how the code was produced.

In addition, certifiable AI (an experimental proposal requiring LLMs to generate correctness proofs along with code) and other
techniques seem to suggest that combining AI code generation with formal verification techniques may result in higher-quality code.

## Conclusion

Formal verification extends traditional testing by providing guarantees about entire classes of program behavior rather than
individual executions, often at the cost of added complexity. Techniques such as model checking and abstract interpretation
allow engineers to enforce correctness, security, and privacy properties at the code level.

Although computational cost and proof maintenance limit its widespread use, integrating verification into DevOps pipelines
enables automated enforcement of critical system policies, which will only become more valuable as software systems grow
more complex and automated code generation becomes more common.
