#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}
ECR_REGISTRY=${3}

echo "🚀 Deploying IntelliTrack to AWS ECS - $ENVIRONMENT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI found${NC}"

# Load environment
export $(cat ".env.$ENVIRONMENT" | xargs)

# Get account ID if ECR not provided
if [ -z "$ECR_REGISTRY" ]; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGISTRY="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
fi

BACKEND_IMAGE="$ECR_REGISTRY/intellitrack-backend:$ENVIRONMENT"
FRONTEND_IMAGE="$ECR_REGISTRY/intellitrack-frontend:$ENVIRONMENT"

echo "📦 Building images..."

# Build and push backend
docker build -f Dockerfile.backend -t $BACKEND_IMAGE .
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
docker push $BACKEND_IMAGE
echo -e "${GREEN}✓ Backend image pushed${NC}"

# Build and push frontend
docker build -f Dockerfile.frontend -t $FRONTEND_IMAGE .
docker push $FRONTEND_IMAGE
echo -e "${GREEN}✓ Frontend image pushed${NC}"

# Update ECS task definition
echo -e "${YELLOW}📝 Updating ECS task definition...${NC}"

TASK_DEF=$(cat <<EOF
{
  "family": "intellitrack-$ENVIRONMENT",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "$BACKEND_IMAGE",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DEBUG",
          "value": "${DEBUG}"
        },
        {
          "name": "ENVIRONMENT",
          "value": "$ENVIRONMENT"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/intellitrack-backend-$ENVIRONMENT",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/docs || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 60
      }
    },
    {
      "name": "frontend",
      "image": "$FRONTEND_IMAGE",
      "portMappings": [
        {
          "containerPort": 5173,
          "hostPort": 5173,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "VITE_API_URL",
          "value": "https://api.$ENVIRONMENT.example.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/intellitrack-frontend-$ENVIRONMENT",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:5173/ || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF
)

echo "$TASK_DEF" > task-definition.json

# Register task definition
TASK_REVISION=$(aws ecs register-task-definition \
    --cli-input-json file://task-definition.json \
    --region $AWS_REGION \
    --query 'taskDefinition.revision' \
    --output text)

echo -e "${GREEN}✓ Task definition registered: $TASK_REVISION${NC}"

# Update ECS service
echo -e "${YELLOW}🔄 Updating ECS service...${NC}"

aws ecs update-service \
    --cluster "intellitrack-$ENVIRONMENT" \
    --service "intellitrack-$ENVIRONMENT" \
    --task-definition "intellitrack-$ENVIRONMENT:$TASK_REVISION" \
    --region $AWS_REGION

echo -e "${GREEN}✓ Service updated${NC}"

echo -e "${GREEN}✅ Deployment to AWS ECS successful!${NC}"
