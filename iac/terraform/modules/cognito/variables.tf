variable "domain_prefix" {
  description = "Cognito hosted UI domain prefix"
  type        = string
}

variable "callback_url" {
  description = "OAuth callback URL"
  type        = string
}

variable "logout_url" {
  description = "OAuth logout URL"
  type        = string
}

variable "post_confirmation_lambda_arn" {
  description = "ARN of the post-confirmation Lambda"
  type        = string
  default     = ""
}