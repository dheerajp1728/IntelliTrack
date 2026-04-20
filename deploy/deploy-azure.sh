#!/bin/bash
set -e

ENVIRONMENT=${1:-dev}
RESOURCE_GROUP=${2}
REGISTRY_NAME=${3}

echo "🚀 Deploying IntelliTrack to Azure - $ENVIRONMENT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Azure CLI found${NC}"

# Load environment
export $(cat ".env.$ENVIRONMENT" | xargs)

# Login to Azure
echo -e "${YELLOW}🔐 Authenticating with Azure...${NC}"
az login

# Create resource group if it doesn't exist
echo -e "${YELLOW}📁 Ensuring resource group exists...${NC}"
az group create --name $RESOURCE_GROUP --location eastus || true

# Build and push images
echo -e "${YELLOW}📦 Building and pushing images to ACR...${NC}"

BACKEND_IMAGE="$REGISTRY_NAME.azurecr.io/intellitrack-backend:$ENVIRONMENT"
FRONTEND_IMAGE="$REGISTRY_NAME.azurecr.io/intellitrack-frontend:$ENVIRONMENT"

# Login to registry
az acr login --name $REGISTRY_NAME

# Build in registry
az acr build --registry $REGISTRY_NAME --image intellitrack-backend:$ENVIRONMENT -f Dockerfile.backend .
echo -e "${GREEN}✓ Backend image built${NC}"

az acr build --registry $REGISTRY_NAME --image intellitrack-frontend:$ENVIRONMENT -f Dockerfile.frontend .
echo -e "${GREEN}✓ Frontend image built${NC}"

# Deploy using Container Apps
echo -e "${YELLOW}🚀 Deploying to Azure Container Instances...${NC}"

# Create backend container
az container create \
    --resource-group $RESOURCE_GROUP \
    --name intellitrack-backend-$ENVIRONMENT \
    --image $BACKEND_IMAGE \
    --cpu 1 \
    --memory 1 \
    --port 8000 \
    --registry-login-server $REGISTRY_NAME.azurecr.io \
    --registry-username $(az acr credential show -n $REGISTRY_NAME --query "username" -o tsv) \
    --registry-password $(az acr credential show -n $REGISTRY_NAME --query "passwords[0].value" -o tsv) \
    --environment-variables DEBUG=$DEBUG ENVIRONMENT=$ENVIRONMENT \
    --restart-policy OnFailure

echo -e "${GREEN}✓ Backend deployed${NC}"

# Create frontend container
az container create \
    --resource-group $RESOURCE_GROUP \
    --name intellitrack-frontend-$ENVIRONMENT \
    --image $FRONTEND_IMAGE \
    --cpu 0.5 \
    --memory 0.5 \
    --port 5173 \
    --registry-login-server $REGISTRY_NAME.azurecr.io \
    --registry-username $(az acr credential show -n $REGISTRY_NAME --query "username" -o tsv) \
    --registry-password $(az acr credential show -n $REGISTRY_NAME --query "passwords[0].value" -o tsv) \
    --restart-policy OnFailure

echo -e "${GREEN}✓ Frontend deployed${NC}"

echo -e "${GREEN}✅ Azure deployment successful!${NC}"

# Get IPs
echo ""
echo "📍 Container IPs:"
BACKEND_IP=$(az container show --resource-group $RESOURCE_GROUP --name intellitrack-backend-$ENVIRONMENT --query ipAddress.ip -o tsv)
FRONTEND_IP=$(az container show --resource-group $RESOURCE_GROUP --name intellitrack-frontend-$ENVIRONMENT --query ipAddress.ip -o tsv)

echo "   Backend: http://$BACKEND_IP:8000"
echo "   Frontend: http://$FRONTEND_IP:5173"
