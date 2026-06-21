variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "carbonfootprints-500112"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "jwt_secret" {
  description = "JWT Secret for authentication"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
