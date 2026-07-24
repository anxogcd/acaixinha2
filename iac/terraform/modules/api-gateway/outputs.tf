output "api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.v1.invoke_url
}

output "api_execution_arn" {
  description = "API Gateway execution ARN prefix"
  value       = aws_api_gateway_rest_api.main.execution_arn
}