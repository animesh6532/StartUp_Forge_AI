# StartupForge-AI API Documentation

## Authentication

All API endpoints (except `/health`) require JWT authentication.

### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "access_token": "jwt_token",
  "token_type": "bearer"
}
```

### Register
```
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "full_name": "User Name"
}
```

## Startup Endpoints

### Create Startup
```
POST /api/v1/startups
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Startup Name",
  "description": "Startup description",
  "industry": "Tech"
}
```

### Get Startup
```
GET /api/v1/startups/{startup_id}
Authorization: Bearer {token}
```

### List Startups
```
GET /api/v1/startups
Authorization: Bearer {token}
```

### Update Startup
```
PUT /api/v1/startups/{startup_id}
Authorization: Bearer {token}
Content-Type: application/json
```

### Delete Startup
```
DELETE /api/v1/startups/{startup_id}
Authorization: Bearer {token}
```

## Report Endpoints

### Generate Report
```
POST /api/v1/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "startup_id": "uuid",
  "report_type": "comprehensive"
}
```

### Get Report
```
GET /api/v1/reports/{report_id}
Authorization: Bearer {token}
```

### List Reports
```
GET /api/v1/reports?startup_id={startup_id}
Authorization: Bearer {token}
```

### Export Report
```
GET /api/v1/reports/{report_id}/export?format=pdf
Authorization: Bearer {token}
```

## Health Endpoint

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Responses

All errors return appropriate HTTP status codes:

- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

Error response format:
```json
{
  "detail": "Error message"
}
```

## Rate Limiting

API calls are rate limited to 100 requests per minute per user.

## Pagination

List endpoints support pagination:
```
GET /api/v1/startups?skip=0&limit=10
```
