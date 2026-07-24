locals {
  env_vars = {
    DYNAMODB_TABLE_USERS                = var.users_table_name
    DYNAMODB_TABLE_MEMORIES             = var.memories_table_name
    DYNAMODB_TABLE_MEMORY_SHARES        = var.memory_shares_table_name
    S3_BUCKET_NAME                      = var.s3_media_bucket_name
    COGNITO_USER_POOL_ID                = var.cognito_user_pool_id
    COGNITO_CLIENT_ID                   = var.cognito_client_id
    AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
  }

  lambdas = {
    "createUser"          = { handler = "user/infrastructure/lambdas/createUser.handler", auth = true }
    "getUser"             = { handler = "user/infrastructure/lambdas/getUser.handler", auth = true }
    "updateUserProfile"   = { handler = "user/infrastructure/lambdas/updateUserProfile.handler", auth = true }
    "deleteUser"          = { handler = "user/infrastructure/lambdas/deleteUser.handler", auth = true }
    "createMemory"        = { handler = "memory/infrastructure/lambdas/createMemory.handler", auth = true }
    "getMemory"           = { handler = "memory/infrastructure/lambdas/getMemory.handler", auth = true }
    "updateMemory"        = { handler = "memory/infrastructure/lambdas/updateMemory.handler", auth = true }
    "deleteMemory"        = { handler = "memory/infrastructure/lambdas/deleteMemory.handler", auth = true }
    "listMemories"        = { handler = "memory/infrastructure/lambdas/listMemories.handler", auth = true }
    "searchMemories"      = { handler = "memory/infrastructure/lambdas/searchMemories.handler", auth = true }
    "shareMemory"         = { handler = "memory/infrastructure/lambdas/shareMemory.handler", auth = true }
    "unshareMemory"       = { handler = "memory/infrastructure/lambdas/unshareMemory.handler", auth = true }
    "addAttachment"       = { handler = "memory/infrastructure/lambdas/addAttachment.handler", auth = true }
    "removeAttachment"    = { handler = "memory/infrastructure/lambdas/removeAttachment.handler", auth = true }
    "generateUploadUrl"   = { handler = "memory/infrastructure/lambdas/generateUploadUrl.handler", auth = true }
    "generateDownloadUrl" = { handler = "memory/infrastructure/lambdas/generateDownloadUrl.handler", auth = true }
    "confirmAttachment"   = { handler = "memory/infrastructure/lambdas/confirmAttachment.handler", auth = true }
  }
}

data "archive_file" "lambda_code" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/lambda_code.zip"
}

resource "aws_lambda_function" "functions" {
  for_each = local.lambdas

  function_name    = "acaixinha-dev-${each.key}"
  role             = var.role_arn
  handler          = each.value.handler
  runtime          = "nodejs22.x"
  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  memory_size = 256
  timeout     = 10

  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_function" "post_confirmation" {
  function_name    = "acaixinha-dev-postConfirmation"
  role             = var.role_arn
  handler          = "auth/infrastructure/lambdas/postConfirmation.handler"
  runtime          = "nodejs22.x"
  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  memory_size = 256
  timeout     = 10

  environment {
    variables = {
      DYNAMODB_TABLE_USERS                = var.users_table_name
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }
}

resource "aws_lambda_permission" "api_gateway" {
  for_each = local.lambdas

  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*/*"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}