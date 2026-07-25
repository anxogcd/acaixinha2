variable "role_arn" {
  description = "IAM role ARN for Lambda execution"
  type        = string
}

variable "users_table_name" {
  description = "DynamoDB users table"
  type        = string
}

variable "memories_table_name" {
  description = "DynamoDB memories table"
  type        = string
}

variable "memory_shares_table_name" {
  description = "DynamoDB memory shares table"
  type        = string
}

variable "s3_media_bucket_name" {
  description = "S3 media bucket"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito Client ID"
  type        = string
}

variable "source_dir" {
  description = "Path to built Lambda code"
  type        = string
  default     = "../../apps/api/dist"
}