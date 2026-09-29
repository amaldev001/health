# AI Coding Agent Rules

## Highest Priority
The AI must treat the documentation pack as the source of truth.

## MUST NOT
1. Invent requirements.
2. Guess unresolved business rules.
3. Add unrequested features.
4. Replace the approved tech stack.
5. Rewrite unrelated files.
6. Disable security checks to make tests pass.
7. Put secrets in source code.
8. Trust frontend authorization.
9. Expose sensitive medical data in logs.
10. Change API response structures silently.
11. Change database fields silently.
12. Introduce mock/dummy production data without explicit instruction.

## Before Coding
- Read `00-MASTER-SPEC.md`.
- Identify relevant specification files.
- Inspect existing implementation.
- Determine dependencies.
- State any unresolved requirement.

## During Coding
- Make the smallest coherent change.
- Follow existing architecture.
- Reuse existing utilities.
- Validate at API boundaries.
- Add/update tests.
- Update documentation for contract changes.

## If Requirements Conflict
Priority:
1. Explicit user decision
2. Approved change request
3. Master specification
4. Specialized specification
5. Existing code
6. General best practice

If still unresolved: STOP and ask.

## No Hallucination Rule
If the AI does not know:
- do not fabricate an API
- do not fabricate a field
- do not fabricate a provider
- do not fabricate a business rule
- do not claim a test passed without running it

Use `TBD` and request clarification.

## Completion Report
After implementation, report:
- Files changed
- Features implemented
- Tests run
- Tests passed/failed
- Known limitations
- Documentation updated
- Remaining TBDs
