# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- AWS account (for production deployment)
- Environment variables configured

## Local Development

### Using Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Qdrant vector store
- FastAPI backend
- React frontend
- Nginx reverse proxy

### Accessing Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs
- Qdrant Dashboard: http://localhost:6333

## Production Deployment

### AWS Deployment

#### 1. Build Docker Images

```bash
docker build -f deployment/Dockerfile.backend -t startupforge-backend:latest .
docker build -f deployment/Dockerfile.frontend -t startupforge-frontend:latest .
```

#### 2. Push to ECR

```bash
aws ecr create-repository --repository-name startupforge-backend
aws ecr create-repository --repository-name startupforge-frontend

docker tag startupforge-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/startupforge-backend:latest
docker tag startupforge-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/startupforge-frontend:latest

docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/startupforge-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/startupforge-frontend:latest
```

#### 3. Deploy to ECS

```bash
# Deploy backend service
aws ecs create-service --cluster production \
  --service-name startupforge-backend \
  --task-definition startupforge-backend:1 \
  --desired-count 2

# Deploy frontend service
aws ecs create-service --cluster production \
  --service-name startupforge-frontend \
  --task-definition startupforge-frontend:1 \
  --desired-count 2
```

#### 4. RDS Setup

```bash
aws rds create-db-instance \
  --db-instance-identifier startupforge-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 20
```

## Environment Configuration

Set the following environment variables:

```bash
export BACKEND_HOST=0.0.0.0
export BACKEND_PORT=8000
export DATABASE_URL=postgresql://user:password@host:5432/startupforge
export OPENAI_API_KEY=your-key
export QDRANT_HOST=qdrant.example.com
export QDRANT_PORT=6333
```

## Monitoring

### Logs

```bash
# Backend logs
docker logs <backend-container-id>

# Frontend logs
docker logs <frontend-container-id>
```

### Health Checks

```bash
curl http://localhost:8000/health
```

## Database Migrations

```bash
alembic upgrade head
```

## Backup and Recovery

### Database Backup

```bash
pg_dump -U startupforge -h localhost startupforge > backup.sql
```

### Database Restore

```bash
psql -U startupforge -h localhost startupforge < backup.sql
```
