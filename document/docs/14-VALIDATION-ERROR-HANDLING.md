# Validation and Error Handling

## Validation
All untrusted input must be validated on the server.

Validate:
- Required fields
- Types
- String lengths
- Email format
- Enum values
- Dates/times
- ObjectId values
- Numeric ranges
- Request body structure

## Error Categories
- VALIDATION_ERROR
- AUTHENTICATION_REQUIRED
- INVALID_CREDENTIALS
- FORBIDDEN
- NOT_FOUND
- CONFLICT
- RATE_LIMITED
- INTERNAL_ERROR

## Rules
- Never expose stack traces in production.
- Never expose database connection strings.
- Never expose password hashes.
- Never return raw MongoDB errors to clients.
- Log correlation/request identifiers where useful.
- Do not log passwords, tokens, medical notes, or sensitive personal data.
