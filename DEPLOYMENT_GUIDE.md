# IntelliTrack Cloud Deployment Guide

## Overview
This guide covers deploying IntelliTrack to various cloud platforms using Docker containers and Kubernetes.

## Prerequisites

### Local Development
```bash
# Install Docker & Docker Compose
brew install docker docker-compose  # macOS
# or apt-get install docker.io docker-compose  # Linux

# Verify installation
docker --version
docker-compose --version
```

### Cloud Platforms
- **AWS**: AWS CLI + IAM permissions for ECR, ECS, or EKS
- **GCP**: gcloud CLI + project with Container Registry enabled
- **Azure**: Azure CLI + subscription with Container Instances/Registry enabled
- **Kubernetes**: kubectl + kubeconfig

---

## Local Docker Deployment

### Quick Start
```bash
# Copy environment template
cp .env.example .env.dev

# Run deployment script
chmod +x deploy/deploy.sh
./deploy/deploy.sh dev
```

### Manual Docker Compose
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose Profiles
```bash
# With caching (Redis)
docker-compose --profile with-cache up -d

# With reverse proxy (Nginx)
docker-compose --profile with-proxy up -d

# Both
docker-compose --profile with-cache --profile with-proxy up -d
```

---

## AWS Deployment

### Prerequisites
```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure

# Verify
aws sts get-caller-identity
```

### Option 1: AWS ECR + ECS (Recommended)

#### Step 1: Create ECR Repository
```bash
aws ecr create-repository --repository-name intellitrack-backend
aws ecr create-repository --repository-name intellitrack-frontend
```

#### Step 2: Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name intellitrack-prod
```

#### Step 3: Deploy with Script
```bash
chmod +x deploy/deploy-aws.sh
./deploy/deploy-aws.sh prod us-east-1
```

### Option 2: AWS EKS (Kubernetes)

#### Step 1: Create EKS Cluster
```bash
eksctl create cluster --name intellitrack --version 1.27 --region us-east-1 --nodegroup-name nodes
```

#### Step 2: Deploy with kubectl
```bash
# Update parameters in k8s/deployment.yaml
kubectl apply -f k8s/deployment.yaml

# Verify
kubectl get pods -n intellitrack
kubectl get svc -n intellitrack
```

#### Step 3: Setup ALB Ingress
```bash
# Install ALB Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system --set clusterName=intellitrack
```

### Environment Variables (.env.prod)
```env
DEBUG=false
DATABASE_URL=postgresql://user:pass@intellitrack-db.xxxxx.rds.amazonaws.com:5432/intellitrack
CORS_ORIGINS=https://intellitrack.example.com
AWS_REGION=us-east-1
AWS_ECR_REGISTRY=123456789.dkr.ecr.us-east-1.amazonaws.com
```

---

## Google Cloud Platform (GCP) Deployment

### Prerequisites
```bash
# Install gcloud CLI
curl https://cloud.google.com/sdk/docs/install | bash

# Initialize
gcloud init

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### Option 1: Cloud Run (Serverless)

#### Step 1: Enable APIs
```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

#### Step 2: Deploy with Script
```bash
chmod +x deploy/deploy-gcp.sh
./deploy/deploy-gcp.sh prod YOUR_PROJECT_ID us-central1
```

#### Step 3: Configure Domain
```bash
# Map custom domain
gcloud run services update-traffic intellitrack-backend \
  --update-routes /=intellitrack-backend-xxx,/api=intellitrack-api
```

### Option 2: GKE (Kubernetes)

#### Step 1: Create GKE Cluster
```bash
gcloud container clusters create intellitrack \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-1
```

#### Step 2: Get Credentials
```bash
gcloud container clusters get-credentials intellitrack --zone us-central1-a
```

#### Step 3: Deploy
```bash
kubectl apply -f k8s/deployment.yaml
```

#### Step 4: Setup Ingress
```bash
# Create static IP
gcloud compute addresses create intellitrack-ip --global

# Apply ingress with SSL
kubectl apply -f k8s/ingress-gcp.yaml
```

### Environment Variables (.env.prod)
```env
DEBUG=false
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
DATABASE_URL=postgresql://user:pass@cloudsql-proxy:5432/intellitrack
```

---

## Azure Deployment

### Prerequisites
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Login
az login

# Set subscription
az account set --subscription YOUR_SUBSCRIPTION_ID
```

### Option 1: Container Instances (ACI)

#### Step 1: Create Resource Group
```bash
az group create --name intellitrack --location eastus
```

#### Step 2: Create Container Registry
```bash
az acr create --resource-group intellitrack \
  --name intellitrackacr --sku Standard
```

#### Step 3: Deploy with Script
```bash
chmod +x deploy/deploy-azure.sh
./deploy/deploy-azure.sh prod intellitrack intellitrackacr
```

### Option 2: AKS (Kubernetes)

#### Step 1: Create AKS Cluster
```bash
az aks create --resource-group intellitrack \
  --name intellitrack \
  --node-count 3 \
  --vm-set-type VirtualMachineScaleSets \
  --load-balancer-sku standard \
  --attach-acr intellitrackacr
```

#### Step 2: Get Credentials
```bash
az aks get-credentials --resource-group intellitrack --name intellitrack
```

#### Step 3: Deploy
```bash
kubectl apply -f k8s/deployment.yaml
```

### Environment Variables (.env.prod)
```env
DEBUG=false
AZURE_RESOURCE_GROUP=intellitrack
AZURE_REGISTRY_NAME=intellitrackacr
DATABASE_URL=postgresql://user:pass@intellitrack-db.postgres.database.azure.com:5432/intellitrack
```

---

## Kubernetes (Any Provider)

### Deploy
```bash
# Create namespace
kubectl create namespace intellitrack

# Deploy resources
kubectl apply -f k8s/deployment.yaml

# Wait for rollout
kubectl rollout status deployment/intellitrack-backend -n intellitrack

# Get services
kubectl get svc -n intellitrack
```

### Monitoring
```bash
# View pods
kubectl get pods -n intellitrack

# View logs
kubectl logs -f deployment/intellitrack-backend -n intellitrack

# Port forward
kubectl port-forward svc/intellitrack-backend 8000:8000 -n intellitrack
```

### Scale
```bash
# Manual scaling
kubectl scale deployment intellitrack-backend --replicas 5 -n intellitrack

# HPA status
kubectl get hpa -n intellitrack
```

### Update Images
```bash
kubectl set image deployment/intellitrack-backend \
  backend=gcr.io/project/intellitrack-backend:v2 \
  -n intellitrack
```

---

## CI/CD Pipeline (GitHub Actions)

The `.github/workflows/build-deploy.yml` automatically:
- Builds Docker images on every push
- Runs tests
- Pushes to registry
- Deploys to test on develop branch
- Deploys to production on main branch

### Setup Secrets
```bash
# In GitHub repo settings > Secrets:
DEPLOY_KEY_TEST
DEPLOY_HOST_TEST
DEPLOY_KEY_PROD
DEPLOY_HOST_PROD
SLACK_WEBHOOK
```

---

## SSL/TLS Configuration

### Using Let's Encrypt

#### With Certbot (Nginx)
```bash
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -v /var/log/letsencrypt:/var/log/letsencrypt \
  certbot/certbot certonly --standalone \
  -d intellitrack.example.com
```

#### With cert-manager (Kubernetes)
```bash
# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

## Monitoring & Logging

### Cloud Provider Solutions
- **AWS**: CloudWatch
- **GCP**: Cloud Logging & Cloud Monitoring
- **Azure**: Azure Monitor & Log Analytics

### Open Source (Kubernetes)
```bash
# Prometheus + Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# ELK Stack
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch
helm install kibana elastic/kibana
helm install filebeat elastic/filebeat
```

---

## Database considerations

### Local Development
- SQLite (included)

### Production
Recommendations:
- **AWS**: Amazon RDS (PostgreSQL/MySQL)
- **GCP**: Cloud SQL
- **Azure**: Azure Database for PostgreSQL/MySQL

#### Upgrade to PostgreSQL
```bash
# Update requirements.txt
pip install psycopg2-binary

# Update DATABASE_URL
DATABASE_URL=postgresql://user:password@hostname:5432/intellitrack
```

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs intellitrack-backend

# Verify image
docker run -it intellitrack-backend:latest bash
```

### Kubernetes Issues
```bash
# Check pod status
kubectl describe pod POD_NAME -n intellitrack

# Check events
kubectl get events -n intellitrack

# Debug pod
kubectl exec -it POD_NAME -n intellitrack -- bash
```

### Network Issues
```bash
# Test connectivity
kubectl run debug --image=curlimages/curl -it --rm -- sh
curl http://intellitrack-backend:8000/docs

# Port forward
kubectl port-forward svc/intellitrack-backend 8000:8000
```

---

## Security Best Practices

1. **Use secrets** for sensitive data (not environment variables)
2. **Enable SSL/TLS** in production
3. **Use non-root users** in containers
4. **Scan images** for vulnerabilities
5. **Implement network policies** in Kubernetes
6. **Use role-based access control** (RBAC)
7. **Enable audit logging** in Kubernetes
8. **Keep dependencies updated**

---

## Maintenance

### Update Images
```bash
# Rebuild and push
docker build -f Dockerfile.backend -t registry/intellitrack-backend:v2 .
docker push registry/intellitrack-backend:v2

# Update deployment
kubectl set image deployment/intellitrack-backend \
  backend=registry/intellitrack-backend:v2 -n intellitrack
```

### Backup Database
```bash
# Kubernetes
kubectl exec POD_NAME -n intellitrack -- \
  pg_dump -U postgres intellitrack > backup.sql

# Cloud providers use native backup solutions
```

---

## Support & Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS ECS Guide](https://docs.aws.amazon.com/ecs/)
- [GCP Cloud Run](https://cloud.google.com/run/docs)
- [Azure Container Instances](https://docs.microsoft.com/en-us/azure/container-instances/)
