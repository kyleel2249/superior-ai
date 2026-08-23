# Terraform scaffold

Default `enable = false` so `terraform plan` is safe.

```bash
cd deploy/terraform
terraform init
terraform plan
# terraform apply -var='enable=true'
```

Prefer Helm on an existing cluster for most deployments.
