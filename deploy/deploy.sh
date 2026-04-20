#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}

echo "🚀 Starting IntelliTrack deployment to $ENVIRONMENT..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker found${NC}"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat ".env.$ENVIRONMENT" | xargs)
    echo -e "${GREEN}✓ Loaded .env.$ENVIRONMENT${NC}"
else
    echo -e "${YELLOW}⚠ .env.$ENVIRONMENT not found, using defaults${NC}"
fi

# Build images
echo -e "${YELLOW}📦 Building Docker images...${NC}"
docker build -f Dockerfile.backend -t intellitrack-backend:$ENVIRONMENT .
docker build -f Dockerfile.frontend -t intellitrack-frontend:$ENVIRONMENT .
echo -e "${GREEN}✓ Images built${NC}"

# Start services
echo -e "${YELLOW}🔧 Starting services...${NC}"
if [ "$ENVIRONMENT" = "prod" ]; then
    docker-compose --profile with-proxy up -d
else
    docker-compose up -d
fi
echo -e "${GREEN}✓ Services started${NC}"

# Wait for backend to be ready
echo -e "${YELLOW}⏳ Waiting for backend to be healthy...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:8000/docs > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        docker-compose logs backend
        exit 1
    fi
    sleep 1
done

# Seed database
echo -e "${YELLOW}🌱 Seeding database...${NC}"
docker-compose exec -T backend python -c "from app.seed import seed_data; seed_data()" || true
echo -e "${GREEN}✓ Database seeded${NC}"

# Display endpoints
echo ""
echo -e "${GREEN}✅ IntelliTrack deployment successful!${NC}"
echo ""
echo "📍 Endpoints:"
echo -e "   Frontend: http://localhost:5173"
echo -e "   Backend API: http://localhost:8000"
echo -e "   API Docs: http://localhost:8000/docs"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "   Nginx: http://localhost:80"
fi
echo ""
echo "📋 Useful commands:"
echo "   docker-compose logs -f          # View logs"
echo "   docker-compose ps               # View services"
echo "   docker-compose down             # Stop services"
