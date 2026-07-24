resource "aws_api_gateway_rest_api" "main" {
  name = "acaixinha-dev-api"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_authorizer" "cognito" {
  name          = "acaixinha-dev-cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.cognito_user_pool_arn]
}

resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "user_by_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{userId}"
}

resource "aws_api_gateway_resource" "memories" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "memories"
}

resource "aws_api_gateway_resource" "memories_search" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.memories.id
  path_part   = "search"
}

resource "aws_api_gateway_resource" "memory_by_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.memories.id
  path_part   = "{memoryId}"
}

resource "aws_api_gateway_resource" "memory_share" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.memory_by_id.id
  path_part   = "share"
}

resource "aws_api_gateway_resource" "memory_share_by_user" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.memory_share.id
  path_part   = "{userId}"
}

resource "aws_api_gateway_resource" "memory_upload_url" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.memory_by_id.id
  path_part   = "upload-url"
}

resource "aws_api_gateway_resource" "memory_attachments" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.memory_by_id.id
  path_part   = "attachments"
}

resource "aws_api_gateway_resource" "attachment_by_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.memory_attachments.id
  path_part   = "{attachmentId}"
}

resource "aws_api_gateway_resource" "attachment_download_url" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.attachment_by_id.id
  path_part   = "download-url"
}

resource "aws_api_gateway_resource" "attachment_confirm" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.attachment_by_id.id
  path_part   = "confirm"
}

locals {
  methods = {
    # User endpoints
    "POST /users"                         = { resource = aws_api_gateway_resource.users,               lambda = "createUser",        auth = false }
    "GET /users/{userId}"                 = { resource = aws_api_gateway_resource.user_by_id,           lambda = "getUser",           auth = true }
    "PATCH /users/{userId}"               = { resource = aws_api_gateway_resource.user_by_id,           lambda = "updateUserProfile", auth = true }
    "DELETE /users/{userId}"              = { resource = aws_api_gateway_resource.user_by_id,           lambda = "deleteUser",        auth = true }
    # Memory endpoints
    "POST /memories"                      = { resource = aws_api_gateway_resource.memories,             lambda = "createMemory",      auth = true }
    "GET /memories"                       = { resource = aws_api_gateway_resource.memories,             lambda = "listMemories",      auth = true }
    "GET /memories/search"                = { resource = aws_api_gateway_resource.memories_search,      lambda = "searchMemories",    auth = true }
    "GET /memories/{memoryId}"            = { resource = aws_api_gateway_resource.memory_by_id,         lambda = "getMemory",         auth = true }
    "PATCH /memories/{memoryId}"          = { resource = aws_api_gateway_resource.memory_by_id,         lambda = "updateMemory",      auth = true }
    "DELETE /memories/{memoryId}"         = { resource = aws_api_gateway_resource.memory_by_id,         lambda = "deleteMemory",      auth = true }
    "POST /memories/{memoryId}/share"     = { resource = aws_api_gateway_resource.memory_share,         lambda = "shareMemory",       auth = true }
    "DELETE /memories/{memoryId}/share/{userId}" = { resource = aws_api_gateway_resource.memory_share_by_user, lambda = "unshareMemory", auth = true }
    "POST /memories/{memoryId}/upload-url"       = { resource = aws_api_gateway_resource.memory_upload_url,   lambda = "generateUploadUrl", auth = true }
    "POST /memories/{memoryId}/attachments"      = { resource = aws_api_gateway_resource.memory_attachments,  lambda = "addAttachment",    auth = true }
    "GET /memories/{memoryId}/attachments/{attachmentId}/download-url" = { resource = aws_api_gateway_resource.attachment_download_url, lambda = "generateDownloadUrl", auth = true }
    "POST /memories/{memoryId}/attachments/{attachmentId}/confirm"    = { resource = aws_api_gateway_resource.attachment_confirm,      lambda = "confirmAttachment",   auth = true }
    "DELETE /memories/{memoryId}/attachments/{attachmentId}"          = { resource = aws_api_gateway_resource.attachment_by_id,        lambda = "removeAttachment",    auth = true }
  }
}

resource "aws_api_gateway_method" "methods" {
  for_each = local.methods

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = each.value.resource.id
  http_method   = split(" ", each.key)[0]
  authorization = each.value.auth ? "COGNITO_USER_POOLS" : "NONE"
  authorizer_id = each.value.auth ? aws_api_gateway_authorizer.cognito.id : null
}

resource "aws_api_gateway_integration" "methods" {
  for_each = local.methods

  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = each.value.resource.id
  http_method             = aws_api_gateway_method.methods[each.key].http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${var.lambda_invoke_arns[each.value.lambda]}/invocations"
}

resource "aws_api_gateway_method_response" "options_200" {
  for_each = { for k, v in local.methods : k => v if v.auth }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value.resource.id
  http_method = "OPTIONS"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options" {
  for_each = { for k, v in local.methods : k => v if v.auth }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value.resource.id
  http_method = "OPTIONS"
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options" {
  for_each = { for k, v in local.methods : k => v if v.auth }

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = each.value.resource.id
  http_method = "OPTIONS"
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PATCH,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_method.methods,
      aws_api_gateway_integration.methods,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "v1" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "v1"
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = "arn:aws:iam::${var.account_id}:role/acaixinha-dev-api-gateway-cloudwatch"
}