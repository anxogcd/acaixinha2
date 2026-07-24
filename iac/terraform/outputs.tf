output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${module.cloudfront.distribution_domain_name}"
}

output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = module.api_gateway.api_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.client_id
}

output "cognito_domain" {
  description = "Cognito domain prefix"
  value       = var.cognito_domain_prefix
}

output "s3_media_bucket_name" {
  description = "S3 media bucket name"
  value       = var.s3_media_bucket_name
}

output "s3_frontend_bucket_name" {
  description = "S3 frontend bucket name"
  value       = var.s3_frontend_bucket_name
}