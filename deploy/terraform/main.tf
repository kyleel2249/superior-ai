/**
 * SUPERIOR AI — optional Terraform scaffold (AWS example)
 * Does not create resources until variables are set and terraform apply is run.
 */

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "project" {
  type    = string
  default = "superior-ai"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "enable" {
  type        = bool
  default     = false
  description = "Set true to allow resource creation"
}

provider "aws" {
  region = var.region
}

resource "aws_ecr_repository" "web" {
  count = var.enable ? 1 : 0
  name  = "${var.project}/web"
}

resource "aws_ecs_cluster" "main" {
  count = var.enable ? 1 : 0
  name  = var.project
}

output "note" {
  value = var.enable ? "Resources enabled" : "Scaffold only — set enable=true to provision"
}
