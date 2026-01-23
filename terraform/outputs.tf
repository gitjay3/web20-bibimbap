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
