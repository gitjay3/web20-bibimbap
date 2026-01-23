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

# ===================
# Network Interfaces
# ===================

resource "ncloud_network_interface" "app" {
  name                  = "nic-5156202"
  subnet_no             = ncloud_subnet.public.id
  access_control_groups = [ncloud_access_control_group.default.id]

  lifecycle {
    ignore_changes = [name]
  }
}

resource "ncloud_network_interface" "db" {
  name                  = "nic-5163934"
  subnet_no             = ncloud_subnet.public.id
  access_control_groups = [ncloud_access_control_group.default.id]

  lifecycle {
    ignore_changes = [name]
  }
}

# ===================
# Servers
# ===================

# App Server
resource "ncloud_server" "app" {
  subnet_no                 = ncloud_subnet.public.id
  name                      = "bookstcamp-server"
  server_image_product_code = "SW.VSVR.OS.LNX64.UBNTU.SVR24.G003"
  server_product_code       = "SVR.VSVR.AMD.STAND.C002.M008.G003"
  login_key_name            = "ncloud-bookstcamp-authkey"

  network_interface {
    network_interface_no = ncloud_network_interface.app.id
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
    network_interface_no = ncloud_network_interface.db.id
    order                = 0
  }
}

# Public IP for App Server
resource "ncloud_public_ip" "app" {
  server_instance_no = ncloud_server.app.id
}

# ===================
# Monitoring Server
# ===================

resource "ncloud_network_interface" "monitoring" {
  name                  = "bookstcamp-monitoring-eth0"
  subnet_no             = ncloud_subnet.public.id
  access_control_groups = [ncloud_access_control_group.default.id]
}

resource "ncloud_server" "monitoring" {
  subnet_no                 = ncloud_subnet.public.id
  name                      = "bookstcamp-monitoring"
  server_image_product_code = "SW.VSVR.OS.LNX64.UBNTU.SVR24.G003"
  server_product_code       = "SVR.VSVR.AMD.STAND.C002.M008.G003"
  login_key_name            = "ncloud-bookstcamp-authkey"

  network_interface {
    network_interface_no = ncloud_network_interface.monitoring.id
    order                = 0
  }
}

resource "ncloud_public_ip" "monitoring" {
  server_instance_no = ncloud_server.monitoring.id
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

  # Prometheus (VPC 내부 통신만 허용)
  inbound {
    protocol    = "TCP"
    ip_block    = "10.0.0.0/16"
    port_range  = "9090"
    description = "Prometheus internal"
  }

  # PostgreSQL (VPC 내부 통신만 허용)
  inbound {
    protocol    = "TCP"
    ip_block    = "10.0.0.0/16"
    port_range  = "5432"
    description = "PostgreSQL internal"
  }

  # Node Exporter (VPC 내부 통신만 허용)
  inbound {
    protocol    = "TCP"
    ip_block    = "10.0.0.0/16"
    port_range  = "9100"
    description = "Node Exporter internal"
  }

  # Backend Metrics (VPC 내부 통신만 허용)
  inbound {
    protocol    = "TCP"
    ip_block    = "10.0.0.0/16"
    port_range  = "3001"
    description = "Backend metrics internal"
  }

  # Redis Exporter (VPC 내부 통신만 허용)
  inbound {
    protocol    = "TCP"
    ip_block    = "10.0.0.0/16"
    port_range  = "9121"
    description = "Redis Exporter internal"
  }

  # ===================
  # Outbound 규칙
  # ===================

  # VPC 내부 통신
  outbound {
    protocol    = "TCP"
    ip_block    = "10.0.0.0/16"
    port_range  = "1-65535"
    description = "VPC internal"
  }

  # ICMP (ping 응답)
  outbound {
    protocol    = "ICMP"
    ip_block    = "0.0.0.0/0"
    description = "ICMP"
  }

  # HTTP/HTTPS (패키지 업데이트 등)
  outbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "80"
    description = "HTTP"
  }

  outbound {
    protocol    = "TCP"
    ip_block    = "0.0.0.0/0"
    port_range  = "443"
    description = "HTTPS"
  }

  # DNS
  outbound {
    protocol    = "UDP"
    ip_block    = "0.0.0.0/0"
    port_range  = "53"
    description = "DNS"
  }
}
