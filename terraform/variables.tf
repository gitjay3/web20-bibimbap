# NCP Credentials
variable "ncp_access_key" {
  description = "NCP Access Key"
  type        = string
  sensitive   = true
}

variable "ncp_secret_key" {
  description = "NCP Secret Key"
  type        = string
  sensitive   = true
}

# Region
variable "region" {
  description = "NCP Region"
  type        = string
  default     = "KR"
}

# Project
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "bookstcamp"
}

# Network
variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "0.0.0.0/0" # 운영 환경에서는 특정 IP로 제한 권장
}

# Server Image (Ubuntu 20.04)
variable "server_image_code" {
  description = "Server image product code"
  type        = string
  default     = "SW.VSVR.OS.LNX64.UBNTU.SVR2004.B050"
}

# Server Spec (vCPU 2, Memory 8GB)
variable "server_spec_code" {
  description = "Server product code (spec)"
  type        = string
  default     = "SVR.VSVR.STAND.C002.M008.NET.SSD.B050.G002"
}

# Login Key Name (기존 키 이름)
variable "login_key_name" {
  description = "Existing login key name"
  type        = string
  default     = "bookstcamp-key"
}
