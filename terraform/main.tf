terraform {
  required_version = ">= 1.0.0"

  required_providers {
    ncloud = {
      source  = "NaverCloudPlatform/ncloud"
      version = ">= 3.0.0"
    }
  }
}

provider "ncloud" {
  access_key  = var.ncp_access_key
  secret_key  = var.ncp_secret_key
  region      = var.region
  support_vpc = true
}

# VPC
resource "ncloud_vpc" "main" {
  name            = "bookstcamp-vpc"
  ipv4_cidr_block = "10.0.0.0/16"
}

# Subnet
resource "ncloud_subnet" "public" {
  vpc_no         = ncloud_vpc.main.id
  name           = "bookstcamp-subnet"
  subnet         = "10.0.0.0/16"
  zone           = "KR-1"
  network_acl_no = ncloud_vpc.main.default_network_acl_no
  subnet_type    = "PUBLIC"
  usage_type     = "GEN"
}

# ACG
resource "ncloud_access_control_group" "default" {
  vpc_no      = ncloud_vpc.main.id
  name        = "bookstcamp-vpc-default-acg"
  description = "VPC [bookstcamp-vpc] default ACG"
}

# App Server
resource "ncloud_server" "app" {
  subnet_no                 = ncloud_subnet.public.id
  name                      = "bookstcamp-server"
  server_image_product_code = "SW.VSVR.OS.LNX64.UBNTU.SVR24.G003"
  server_product_code       = "SVR.VSVR.AMD.STAND.C002.M008.G003"
  login_key_name            = "ncloud-bookstcamp-authkey"

  network_interface {
    network_interface_no = "5156202"
    order                = 0
  }
}

# DB Server
resource "ncloud_server" "db" {
  subnet_no                 = ncloud_subnet.public.id
  name                      = "bookstcamp-db"
  server_image_product_code = "SW.VSVR.OS.LNX64.UBNTU.SVR24.G003"
  server_product_code       = "SVR.VSVR.AMD.STAND.C002.M008.G003"
  login_key_name            = "ncloud-bookstcamp-authkey"

  network_interface {
    network_interface_no = "5163934"
    order                = 0
  }
}

# ===================
# ACG Inbound/Outbound 규칙
# ===================
resource "ncloud_access_control_group_rule" "default_rules" {
  access_control_group_no = ncloud_access_control_group.default.id

  # SSH
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "22"
    description = "SSH"
  }

  # HTTP
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "80"
    description = "HTTP"
  }

  # HTTPS
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "443"
    description = "HTTPS"
  }

  # Grafana
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "3000"
    description = "Grafana"
  }

  # Prometheus
  inbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "9090"
    description = "Prometheus"
  }

  # PostgreSQL (VPC 내부 통신만 허용)
  inbound {
    protocol    = "TCP"
    ip_block    = "10.0.0.0/16"
    port_range  = "5432"
    description = "PostgreSQL internal"
  }
}
