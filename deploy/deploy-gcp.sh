#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
GCP_PROJECT=${2}
GCP_REGION=${3:-us-central1}

echo "🚀 Deploying IntelliTrack to Google Cloud - $ENVIRONMENT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check gcloud
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ gcloud CLI found${NC}"

# Set project
gcloud config set project $GCP_PROJECT

# Load environment
export $(cat ".env.$ENVIRONMENT" | xargs)

# Configure Docker
echo -e "${YELLOW}🔐 Configuring Docker authentication...${NC}"
gcloud auth configure-docker gcr.io

# Build and push images
echo -e "${YELLOW}📦 Building and pushing images...${NC}"

BACKEND_IMAGE="gcr.io/$GCP_PROJECT/intellitrack-backend:$ENVIRONMENT"
FRONTEND_IMAGE="gcr.io/$GCP_PROJECT/intellitrack-frontend:$ENVIRONMENT"

docker build -f Dockerfile.backend -t $BACKEND_IMAGE .
docker push $BACKEND_IMAGE
echo -e "${GREEN}✓ Backend image pushed${NC}"

docker build -f Dockerfile.frontend -t $FRONTEND_IMAGE .
docker push $FRONTEND_IMAGE
echo -e "${GREEN}✓ Frontend image pushed${NC}"

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"

# Deploy backend
gcloud run deploy intellitrack-backend-$ENVIRONMENT \
    --image $BACKEND_IMAGE \
    --platform managed \
    --region $GCP_REGION \
    --allow-unauthenticated \
    --port 8000 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 3600 \
    --set-env-vars DEBUG=$DEBUG,ENVIRONMENT=$ENVIRONMENT \
    --no-gen2

echo -e "${GREEN}✓ Backend deployed to Cloud Run${NC}"

# Deploy frontend
gcloud run deploy intellitrack-frontend-$ENVIRONMENT \
    --image $FRONTEND_IMAGE \
    --platform managed \
    --region $GCP_REGION \
    --allow-unauthenticated \
    --port 5173 \
    --memory 256Mi \
    --cpu 0.5 \
    --timeout 3600 \
    --set-env-vars VITE_API_URL=https://intellitrack-backend-$ENVIRONMENT-xxx.run.app \
    --no-gen2

echo -e "${GREEN}✓ Frontend deployed to Cloud Run${NC}"

# Deploy to GKE if cluster exists
echo -e "${YELLOW}🔍 Checking for GKE cluster...${NC}"

CLUSTERS=$(gcloud container clusters list --filter="name:intellitrack-$ENVIRONMENT" --format="value(name)")

if [ ! -z "$CLUSTERS" ]; then
    echo -e "${YELLOW}📦 Deploying to GKE...${NC}"
    
    gcloud container clusters get-credentials intellitrack-$ENVIRONMENT --region $GCP_REGION
    kubectl apply -f k8s/deployment.yaml
    
    # Update images
    kubectl set image deployment/intellitrack-backend \
        backend=$BACKEND_IMAGE \
        -n intellitrack
    
    kubectl set image deployment/intellitrack-frontend \
        frontend=$FRONTEND_IMAGE \
        -n intellitrack
    
    echo -e "${GREEN}✓ GKE deployment updated${NC}"
fi

echo -e "${GREEN}✅ Google Cloud deployment successful!${NC}"

# Get URLs
echo ""
echo "📍 Service URLs:"
BACKEND_URL=$(gcloud run services describe intellitrack-backend-$ENVIRONMENT --region $GCP_REGION --format='value(status.url)')
FRONTEND_URL=$(gcloud run services describe intellitrack-frontend-$ENVIRONMENT --region $GCP_REGION --format='value(status.url)')

echo "   Backend: $BACKEND_URL"
echo "   Frontend: $FRONTEND_URL"
