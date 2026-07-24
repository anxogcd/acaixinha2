variable "lambda_invoke_arns" {
  description = "Map of Lambda invoke ARNs keyed by function name"
  type        = map(string)
}

variable "function_names" {
  description = "Map of Lambda function names keyed by function key"
  type        = map(string)
}

variable "requires_auth" {
  description = "Map of booleans indicating whether each Lambda requires Cognito auth"
  type        = map(bool)
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN for authorizer"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}