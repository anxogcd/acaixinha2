variable "users_table_arn" {
  description = "Users DynamoDB table ARN"
  type        = string
}

variable "memories_table_arn" {
  description = "Memories DynamoDB table ARN"
  type        = string
}

variable "memory_shares_table_arn" {
  description = "Memory Shares DynamoDB table ARN"
  type        = string
}

variable "media_bucket_arn" {
  description = "Media S3 bucket ARN"
  type        = string
}

variable "user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}