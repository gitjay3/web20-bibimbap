output "vpc_id" {
  description = "VPC ID"
  value       = ncloud_vpc.main.id
}

output "subnet_id" {
  description = "Public Subnet ID"
  value       = ncloud_subnet.public.id
}

output "acg_id" {
  description = "Default ACG ID"
  value       = ncloud_access_control_group.default.id
}

output "app_server_id" {
  description = "App Server ID"
  value       = ncloud_server.app.id
}

output "db_server_id" {
  description = "DB Server ID"
  value       = ncloud_server.db.id
}

output "monitoring_server_id" {
  description = "Monitoring Server ID"
  value       = ncloud_server.monitoring.id
}

output "app_public_ip" {
  description = "App Server Public IP"
  value       = ncloud_public_ip.app.public_ip
}

output "monitoring_public_ip" {
  description = "Monitoring Server Public IP"
  value       = ncloud_public_ip.monitoring.public_ip
}

# ===================
# Staging Outputs
# ===================

output "staging_app_server_id" {
  description = "Staging App Server ID"
  value       = ncloud_server.staging_app.id
}

output "staging_db_server_id" {
  description = "Staging DB Server ID"
  value       = ncloud_server.staging_db.id
}

output "staging_app_public_ip" {
  description = "Staging App Server Public IP"
  value       = ncloud_public_ip.staging_app.public_ip
}

output "staging_app_private_ip" {
  description = "Staging App Server Private IP"
  value       = ncloud_network_interface.staging_app.private_ip
}

output "staging_db_private_ip" {
  description = "Staging DB Server Private IP"
  value       = ncloud_network_interface.staging_db.private_ip
}
