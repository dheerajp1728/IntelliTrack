#!/usr/bin/env bash

# IntelliTrack Deployment Quick Reference
# Common commands for containerization and cloud deployment

# ============================================
# LOCAL DOCKER DEVELOPMENT
# ============================================

# Build all images
docker-compose build

# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute command in container
docker-compose exec backend python -c "print('test')"
docker-compose exec frontend npm list

# Rebuild single service
docker-compose build backend
docker-compose up backend -d

# Remove volumes (clean slate)
docker-compose down -v

# Run with specific environment
docker-compose --env-file .env.prod up -d


# ============================================
# DATABASE MIGRATIONS (ALEMBIC)
# ============================================

# Apply all migrations
alembic upgrade head

# Show current revision
alembic current

# Show migration history
alembic history

# Create a new migration from model changes
alembic revision --autogenerate -m "describe schema change"

# Roll back one migration
alembic downgrade -1


# ============================================
# DOCKER MANUAL COMMANDS
# ============================================

# Build backend image
docker build -f Dockerfile.backend -t intellitrack-backend:latest .

# Build frontend image
docker build -f Dockerfile.frontend -t intellitrack-frontend:latest .

# Run container interactively
docker run -it intellitrack-backend:latest bash

# Push to registry
docker tag intellitrack-backend:latest myregistry/intellitrack-backend:latest
docker push myregistry/intellitrack-backend:latest

# View image layers
docker history intellitrack-backend:latest

# Inspect image
docker inspect intellitrack-backend:latest

# Check image size
docker images | grep intellitrack

# Remove image
docker rmi intellitrack-backend:latest

# Prune unused images
docker image prune -a


# ============================================
# KUBERNETES DEPLOYMENT
# ============================================

# Apply all resources
kubectl apply -f k8s/deployment.yaml

# Create namespace
kubectl create namespace intellitrack

# Get resources
kubectl get pods -n intellitrack
kubectl get svc -n intellitrack
kubectl get deployments -n intellitrack
kubectl get ingress -n intellitrack

# Watch pod status
kubectl get pods -n intellitrack --watch

# Describe pod (troubleshooting)
kubectl describe pod <pod-name> -n intellitrack

# View logs
kubectl logs <pod-name> -n intellitrack
kubectl logs -f <pod-name> -n intellitrack
kubectl logs <pod-name> -c backend -n intellitrack

# Port forward
kubectl port-forward svc/intellitrack-backend 8000:8000 -n intellitrack
kubectl port-forward pod/<pod-name> 8000:8000 -n intellitrack

# Execute command in pod
kubectl exec <pod-name> -n intellitrack -- ls -la
kubectl exec -it <pod-name> -n intellitrack -- bash

# Scale deployment
kubectl scale deployment intellitrack-backend --replicas 3 -n intellitrack

# Rollout status
kubectl rollout status deployment/intellitrack-backend -n intellitrack

# Update image
kubectl set image deployment/intellitrack-backend \
  backend=myregistry/intellitrack-backend:v2 -n intellitrack

# Rollback deployment
kubectl rollout undo deployment/intellitrack-backend -n intellitrack

# Get HPA status
kubectl get hpa -n intellitrack
kubectl describe hpa intellitrack-backend-hpa -n intellitrack

# Delete resources
kubectl delete pod <pod-name> -n intellitrack
kubectl delete deployment intellitrack-backend -n intellitrack
kubectl delete namespace intellitrack

# Get configuration
kubectl get configmap -n intellitrack
kubectl get secret -n intellitrack

# Events
kubectl get events -n intellitrack


# ============================================
# AWS DEPLOYMENT (ECS)
# ============================================

# List ECR repositories
aws ecr describe-repositories

# Create repository
aws ecr create-repository --repository-name intellitrack-backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker tag intellitrack-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/intellitrack-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/intellitrack-backend:latest

# List ECS clusters
aws ecs list-clusters

# Create ECS cluster
aws ecs create-cluster --cluster-name intellitrack

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# List ECS services
aws ecs list-services --cluster intellitrack

# Create ECS service
aws ecs create-service --cluster intellitrack --service-name intellitrack-api --task-definition intellitrack:1 --desired-count 2

# Update ECS service
aws ecs update-service --cluster intellitrack --service intellitrack-api --task-definition intellitrack:2

# View task logs
aws logs tail /ecs/intellitrack-backend-prod --follow

# Scale service
aws ecs update-service --cluster intellitrack --service intellitrack-api --desired-count 5


# ============================================
# AWS DEPLOYMENT (EKS)
# ============================================

# Create EKS cluster
eksctl create cluster --name intellitrack --version 1.27 --region us-east-1 --nodegroup-name nodes

# Get kubeconfig
aws eks update-kubeconfig --name intellitrack --region us-east-1

# Delete EKS cluster
eksctl delete cluster --name intellitrack


# ============================================
# GCP DEPLOYMENT
# ============================================

# Authenticate
gcloud auth configure-docker

# Build with Cloud Build
gcloud builds submit --tag gcr.io/PROJECT_ID/intellitrack-backend

# Deploy to Cloud Run
gcloud run deploy intellitrack \
  --image gcr.io/PROJECT_ID/intellitrack-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000

# Create GKE cluster
gcloud container clusters create intellitrack --zone us-central1-a --num-nodes 3

# Get GKE credentials
gcloud container clusters get-credentials intellitrack --zone us-central1-a

# Deploy to GKE
kubectl apply -f k8s/deployment.yaml

# View Cloud Run services
gcloud run services list


# ============================================
# AZURE DEPLOYMENT
# ============================================

# Login to Azure
az login

# Create resource group
az group create --name intellitrack --location eastus

# Create container registry
az acr create --resource-group intellitrack --name intellitrackacr --sku Standard

# Build image in ACR
az acr build --registry intellitrackacr --image intellitrack-backend:latest -f Dockerfile.backend .

# Create container instance
az container create \
  --resource-group intellitrack \
  --name intellitrack-backend \
  --image intellitrackacr.azurecr.io/intellitrack-backend:latest \
  --cpu 1 \
  --memory 1

# Get container logs
az container logs --resource-group intellitrack --name intellitrack-backend

# Delete container
az container delete --resource-group intellitrack --name intellitrack-backend

# Create AKS cluster
az aks create --resource-group intellitrack --name intellitrack --node-count 3

# Get AKS credentials
az aks get-credentials --resource-group intellitrack --name intellitrack


# ============================================
# MONITORING & DEBUGGING
# ============================================

# Docker stats (resource usage)
docker stats intellitrack-backend

# View running containers
docker ps

# View all containers
docker ps -a

# Network diagnostics
docker network ls
docker network inspect intellitrack-network

# Health check
curl http://localhost:8000/docs
curl -v http://localhost:8000/docs

# Database connection test
docker-compose exec backend psql -h database -U postgres -c "SELECT 1"

# Performance test
ab -n 100 -c 10 http://localhost:8000/

# Check disk usage
docker system df

# Prune unused resources
docker system prune -a


# ============================================
# CI/CD (GITHUB ACTIONS)
# ============================================

# Trigger workflow manually
gh workflow run build-deploy.yml

# View workflow runs
gh run list --workflow=build-deploy.yml

# View live logs
gh run view <run-id> --log

# Trigger deployment
git push origin main  # Triggers production deployment
git push origin develop  # Triggers test deployment


# ============================================
# COMMON TROUBLESHOOTING
# ============================================

# Check container health
docker inspect --format='{{.State.Health.Status}}' <container-id>

# View detailed container info
docker inspect <container-id>

# Network troubleshooting
docker run -it --rm alpine ping host.docker.internal

# Test API connectivity
docker run --rm -u nobody curlimages/curl curl http://backend:8000/docs

# Clean up failed pods
kubectl delete pods --field-selector status.phase=Failed -n intellitrack

# Check persistent volume
kubectl get pv -n intellitrack

# Find pod by label
kubectl get pods -n intellitrack -l app=intellitrack,component=backend

# Get pod events
kubectl describe pod <pod-name> -n intellitrack | grep -A 10 Events


# ============================================
# USEFUL ALIASES (Add to ~/.bashrc or ~/.zshrc)
# ============================================

# alias kgp='kubectl get pods -n intellitrack'
# alias klogs='kubectl logs -n intellitrack'
# alias kexec='kubectl exec -it -n intellitrack'
# alias kdesc='kubectl describe pod -n intellitrack'
# alias dcp='docker-compose'
# alias dls='docker ps'
# alias dlogs='docker-compose logs -f'
