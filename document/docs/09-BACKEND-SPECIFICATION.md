# Backend Specification

## Structure
```text
backend/src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── validators/
├── utils/
└── app.js
```

## Rules
- Controllers should be thin.
- Services contain business rules.
- Models contain schema definitions.
- Middleware handles cross-cutting concerns.
- Environment variables are loaded centrally.
- Errors flow through a centralized error handler.
- Async handlers must not create unhandled promise rejections.
- Database connections must be initialized before accepting application traffic.

## Response Pattern
Successful response:
```json
{ "success": true, "data": {} }
```

Failure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```
