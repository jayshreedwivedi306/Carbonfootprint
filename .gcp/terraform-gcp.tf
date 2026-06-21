terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "carbonfootprints-terraform-state"
    prefix = "carbonfootprint/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud SQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = "carbonfootprint-db"
  database_version = "POSTGRES_15"
  region           = var.region
  deletion_protection = true

  settings {
    tier              = "db-f1-micro"
    availability_type = "REGIONAL"
    disk_type        = "PD_SSD"
    disk_size        = 20

    database_flags {
      name  = "cloudsql_iam_authentication"
      value = "on"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
    }

    ip_configuration {
      require_ssl = true
      authorized_networks {
        name  = "allow-cloud-run"
        value = "0.0.0.0/0"
      }
    }
  }
}

# Cloud SQL Database
resource "google_sql_database" "database" {
  name     = "carbonfootprint"
  instance = google_sql_database_instance.postgres.name
  charset  = "UTF8"
}

# Cloud SQL User
resource "google_sql_user" "db_user" {
  name     = "carbon_user"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Generate random password
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Cloud Run Service Account
resource "google_service_account" "carbon_sa" {
  account_id   = "carbonfootprints"
  display_name = "Carbon Footprint Application Service Account"
}

# IAM: Cloud Run service account can access Cloud SQL
resource "google_project_iam_member" "cloud_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.carbon_sa.email}"
}

# Secret Manager for database credentials
resource "google_secret_manager_secret" "db_connection_string" {
  secret_id = "carbon-db-connection-string"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_connection_string" {
  secret      = google_secret_manager_secret.db_connection_string.id
  secret_data = "postgresql://${google_sql_user.db_user.name}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}:5432/${google_sql_database.database.name}"
}

# Secret Manager for JWT Secret
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "carbon-jwt-secret"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

# Grant service account access to secrets
resource "google_secret_manager_secret_iam_member" "db_secret_access" {
  secret_id = google_secret_manager_secret.db_connection_string.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.carbon_sa.email}"
}

resource "google_secret_manager_secret_iam_member" "jwt_secret_access" {
  secret_id = google_secret_manager_secret.jwt_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.carbon_sa.email}"
}

# Cloud Run Service - Backend API
resource "google_cloud_run_service" "carbon_server" {
  name     = "carbon-server"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.carbon_sa.email
      containers {
        image = "gcr.io/${var.project_id}/carbon-server:latest"
        ports {
          container_port = 5000
        }
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "PORT"
          value = "5000"
        }
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.db_connection_string.secret_id
              key  = "latest"
            }
          }
        }
        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.jwt_secret.secret_id
              key  = "latest"
            }
          }
        }
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud Run Service - Frontend
resource "google_cloud_run_service" "carbon_client" {
  name     = "carbon-client"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/carbon-client:latest"
        ports {
          container_port = 80
        }
        resources {
          limits = {
            cpu    = "500m"
            memory = "256Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow public access to Cloud Run services
resource "google_cloud_run_service_iam_member" "client_public" {
  service  = google_cloud_run_service.carbon_client.name
  location = google_cloud_run_service.carbon_client.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "server_public" {
  service  = google_cloud_run_service.carbon_server.name
  location = google_cloud_run_service.carbon_server.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "database_connection_name" {
  value       = google_sql_database_instance.postgres.connection_name
  description = "Cloud SQL connection string"
}

output "server_url" {
  value       = google_cloud_run_service.carbon_server.status[0].url
  description = "Cloud Run server service URL"
}

output "client_url" {
  value       = google_cloud_run_service.carbon_client.status[0].url
  description = "Cloud Run client service URL"
}

output "service_account_email" {
  value       = google_service_account.carbon_sa.email
  description = "Service account email for Cloud Run"
}
