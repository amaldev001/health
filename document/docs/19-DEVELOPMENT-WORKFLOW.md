# Development Workflow

## Branches
Recommended:
- main — stable/releasable
- develop — integration
- feature/* — individual work
- fix/* — bug fixes

## Commit Style
Use descriptive commits:
- `feat: add appointment booking`
- `fix: prevent duplicate appointment`
- `refactor: separate appointment service`
- `test: add authorization coverage`

## Pull Request Requirements
- Explain change.
- List affected APIs/models/pages.
- Include tests.
- Confirm documentation was updated if behavior/schema/API changed.
- No secrets.

## Change Control
A feature is not considered complete if code is changed but the relevant specification is not updated.
