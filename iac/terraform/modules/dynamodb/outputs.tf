output "users_table_name" {
  description = "Users DynamoDB table name"
  value       = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  description = "Users DynamoDB table ARN"
  value       = aws_dynamodb_table.users.arn
}

output "memories_table_name" {
  description = "Memories DynamoDB table name"
  value       = aws_dynamodb_table.memories.name
}

output "memories_table_arn" {
  description = "Memories DynamoDB table ARN"
  value       = aws_dynamodb_table.memories.arn
}

output "memory_shares_table_name" {
  description = "Memory Shares DynamoDB table name"
  value       = aws_dynamodb_table.memory_shares.name
}

output "memory_shares_table_arn" {
  description = "Memory Shares DynamoDB table ARN"
  value       = aws_dynamodb_table.memory_shares.arn
}