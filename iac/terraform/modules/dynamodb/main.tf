resource "aws_dynamodb_table" "users" {
  name         = var.users_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "memories" {
  name         = var.memories_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "ownerId"
    type = "S"
  }

  attribute {
    name = "memoryDate"
    type = "S"
  }

  global_secondary_index {
    name            = "ownerId-index"
    hash_key        = "ownerId"
    range_key       = "memoryDate"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "memory_shares" {
  name         = var.memory_shares_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "memoryId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "memoryId"
    type = "S"
  }
}