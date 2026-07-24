output "frontend_bucket_id" {
  description = "Frontend S3 bucket ID"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_bucket_arn" {
  description = "Frontend S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_regional_domain_name" {
  description = "Frontend S3 bucket regional domain name"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

output "media_bucket_id" {
  description = "Media S3 bucket ID"
  value       = aws_s3_bucket.media.id
}

output "media_bucket_arn" {
  description = "Media S3 bucket ARN"
  value       = aws_s3_bucket.media.arn
}