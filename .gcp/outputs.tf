output "cloud_sql_instance" {
  value       = google_sql_database_instance.postgres.connection_name
  description = "Cloud SQL connection name"
}

output "cloud_run_server_url" {
  value       = google_cloud_run_service.carbon_server.status[0].url
  description = "Cloud Run API server URL"
}

output "cloud_run_client_url" {
  value       = google_cloud_run_service.carbon_client.status[0].url
  description = "Cloud Run client application URL"
}

output "service_account_email" {
  value = google_service_account.carbon_sa.email
}
