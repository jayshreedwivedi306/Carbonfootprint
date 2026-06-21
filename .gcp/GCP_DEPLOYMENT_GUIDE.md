# GCP Deployment Guide for Carbon Footprint Application

## Project Details
- **Project ID**: carbonfootprints-500112
- **Project Name**: carbonfootprints
- **Region**: us-central1

## Architecture Overview

This deployment uses:
- **Cloud Run**: For serverless container deployment (frontend & backend)
- **Cloud SQL**: PostgreSQL managed database
- **Container Registry**: For Docker image storage
- **Secret Manager**: For secure credential storage
- **Cloud Build**: For CI/CD automation

## Prerequisites

1. **Install Google Cloud SDK**
   ```bash
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Authenticate with GCP**
   ```bash
   gcloud auth application-default login
   gcloud config set project carbonfootprints-500112
   ```

3. **Enable Required APIs**
   ```bash
   gcloud services enable \
     cloudbuild.googleapis.com \
     run.googleapis.com \
     sqladmin.googleapis.com \
     container.googleapis.com \
     containerregistry.googleapis.com \
     secretmanager.googleapis.com \
     cloudresourcemanager.googleapis.com
   ```

4. **Install Terraform**
   ```bash
   # On macOS
   brew tap hashicorp/tap
   brew install hashicorp/tap/terraform
   
   # On Linux
   wget https://releases.hashicorp.com/terraform/1.5.0/terraform_1.5.0_linux_amd64.zip
   unzip terraform_1.5.0_linux_amd64.zip
   mv terraform /usr/local/bin/
   ```

## Deployment Steps

### Step 1: Configure Environment Variables

```bash
export PROJECT_ID="carbonfootprints-500112"
export REGION="us-central1"
export SERVICE_NAME="carbon-server"
export JWT_SECRET="your-secret-jwt-key-here" # Change this!
```

### Step 2: Create GCS Bucket for Terraform State

```bash
gsutil mb -p $PROJECT_ID gs://carbonfootprints-terraform-state
gcloud storage buckets update gs://carbonfootprints-terraform-state \
  --versioning
```

### Step 3: Initialize Terraform

```bash
cd .gcp
terraform init
```

### Step 4: Plan and Apply Terraform

```bash
terraform plan -var="jwt_secret=$JWT_SECRET" -out=tfplan
terraform apply tfplan
```

This will create:
- Cloud SQL PostgreSQL instance
- Service accounts and IAM roles
- Secrets in Secret Manager
- Cloud Run services

### Step 5: Build and Push Docker Images

```bash
# Configure Docker authentication
gcloud auth configure-docker

# Build server image
docker build -t gcr.io/$PROJECT_ID/carbon-server:latest -f server/Dockerfile ./server
docker push gcr.io/$PROJECT_ID/carbon-server:latest

# Build client image
docker build -t gcr.io/$PROJECT_ID/carbon-client:latest -f client/Dockerfile ./client
docker push gcr.io/$PROJECT_ID/carbon-client:latest
```

### Step 6: Deploy to Cloud Run (Using Cloud Build)

```bash
gcloud builds submit \
  --config=.gcp/cloudbuild.yaml \
  --project=$PROJECT_ID
```

### Step 7: Set Environment Variables for Cloud Run

```bash
# Get Cloud SQL connection name
CONN_NAME=$(gcloud sql instances describe carbonfootprint-db --format='value(connectionName)')

# Deploy server with environment variables
gcloud run deploy carbon-server \
  --image=gcr.io/$PROJECT_ID/carbon-server:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,PORT=5000" \
  --set-cloudsql-instances=$CONN_NAME \
  --service-account=carbonfootprints@$PROJECT_ID.iam.gserviceaccount.com

# Deploy client
gcloud run deploy carbon-client \
  --image=gcr.io/$PROJECT_ID/carbon-client:latest \
  --platform=managed \
  --region=$REGION \
  --allow-unauthenticated
```

### Step 8: Verify Deployment

```bash
# Get service URLs
gcloud run services describe carbon-server --region=$REGION --format='value(status.url)'
gcloud run services describe carbon-client --region=$REGION --format='value(status.url)'

# Check Cloud SQL instance
gcloud sql instances describe carbonfootprint-db

# View logs
gcloud run services describe carbon-server --region=$REGION
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=carbon-server" --limit 50 --format json
```

## Database Initialization

### Connect to Cloud SQL

```bash
# Using Cloud SQL Proxy
gcloud sql connect carbonfootprint-db --user=carbon_user

# Or using gcloud SQL Shell
gcloud sql connect carbonfootprint-db
```

### Run Database Migrations

```bash
# From the server directory
npm run prisma:migrate
npm run db:seed
```

## Monitoring and Logging

### View Cloud Run Logs

```bash
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=50 \
  --format=json

# Real-time streaming
gcloud logging read "resource.type=cloud_run_revision" \
  --follow
```

### Cloud SQL Monitoring

```bash
# Check database connections
gcloud sql operations list \
  --instance=carbonfootprint-db

# View instance metrics
gcloud monitoring metrics-descriptors list \
  --filter="resource.type=cloudsql_database"
```

## Updating the Application

### Deploying New Versions

```bash
# Build and push new images
docker build -t gcr.io/$PROJECT_ID/carbon-server:v1.1 -f server/Dockerfile ./server
docker push gcr.io/$PROJECT_ID/carbon-server:v1.1

# Deploy new version to Cloud Run
gcloud run deploy carbon-server \
  --image=gcr.io/$PROJECT_ID/carbon-server:v1.1 \
  --platform=managed \
  --region=$REGION
```

## Troubleshooting

### Cloud Run Service Won't Start

1. Check logs:
   ```bash
   gcloud run services describe carbon-server --region=$REGION
   ```

2. Verify environment variables and secrets
3. Check IAM permissions for service account

### Database Connection Issues

1. Verify Cloud SQL instance is running:
   ```bash
   gcloud sql instances list
   ```

2. Check network configuration and authorized networks
3. Ensure service account has Cloud SQL Client role

### High Costs

- Monitor Cloud Run invocations and CPU/memory usage
- Set up budget alerts in GCP Console
- Consider using Cloud Run memory/CPU scaling
- Use Cloud SQL on-demand pricing for non-production environments

## Cleanup

To delete all resources:

```bash
# Destroy Terraform resources
terraform destroy -var="jwt_secret=$JWT_SECRET"

# Delete container images
gcloud container images delete gcr.io/$PROJECT_ID/carbon-server:latest
gcloud container images delete gcr.io/$PROJECT_ID/carbon-client:latest

# Delete GCS bucket
gsutil -m rm -r gs://carbonfootprints-terraform-state
```

## Security Best Practices

1. ✅ Use Secret Manager for sensitive data
2. ✅ Implement service accounts with minimal IAM roles
3. ✅ Enable Cloud SQL SSL/TLS connections
4. ✅ Use VPC Service Controls for additional security
5. ✅ Implement IAM policy audit logging
6. ✅ Set up security scanning for container images
7. ✅ Use Cloud Armor for DDoS protection

## Cost Estimation

- **Cloud Run**: Pay-per-use (estimated $5-15/month for low traffic)
- **Cloud SQL**: ~$20-30/month (f1-micro instance with SSD)
- **Container Registry**: Free tier includes 500MB storage
- **Secret Manager**: $6/month per secret
- **Cloud Build**: Free tier includes 120 minutes/day

## Support and Documentation

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Terraform Google Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GCP Console](https://console.cloud.google.com)
