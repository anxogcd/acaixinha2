variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "cognito_domain_prefix" {
  description = "Prefix for Cognito hosted UI domain"
  type        = string
  default     = "acaixinha-dev"
}

variable "s3_frontend_bucket_name" {
  description = "S3 bucket name for frontend hosting"
  type        = string
  default     = "acaixinha-dev-frontend"
}

variable "s3_media_bucket_name" {
  description = "S3 bucket name for media files"
  type        = string
  default     = "acaixinha-dev-media"
}

variable "dynamodb_users_table" {
  description = "DynamoDB table name for users"
  type        = string
  default     = "acaixinha-dev-users"
}

variable "dynamodb_memories_table" {
  description = "DynamoDB table name for memories"
  type        = string
  default     = "acaixinha-dev-memories"
}

variable "dynamodb_memory_shares_table" {
  description = "DynamoDB table name for memory shares"
  type        = string
  default     = "acaixinha-dev-memory-shares"
}

variable "cognito_callback_url" {
  description = "Cognito callback URL (set after CloudFront is created)"
  type        = string
  default     = "http://localhost:5173/callback"
}

variable "cognito_logout_url" {
  description = "Cognito logout URL"
  type        = string
  default     = "http://localhost:5173"
}