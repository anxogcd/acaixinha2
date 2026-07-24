# IaC Terraform (Dev) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Terraform infrastructure as code for the Acaixinha dev environment — S3, CloudFront, DynamoDB, Cognito, 18 Lambda functions, API Gateway, IAM roles.

**Architecture:** Modular Terraform with local backend. Each AWS service gets its own module. Main.tf wires everything together via module outputs. Variables for region, bucket names, Cognito config. Outputs for frontend URL, API URL, Cognito IDs.

**Tech Stack:** Terraform 1.x, AWS provider, HCL

## Global Constraints

- Dev environment only (no prod separation needed)
- Local backend (no remote S3 state for dev)
- DynamoDB billing: PAY_PER_REQUEST
- Lambda runtime: nodejs22.x, memory 256MB, timeout 10s
- API Gateway: REST API (not HTTP), Cognito authorizer, CORS
- Lambda code references from local source (zipped via `archive_file` data source)
- All resource names prefixed with `acaixinha-dev-`

---

### Task 1: Base setup (provider, backend, variables, outputs)

**Files:**
- Create: `iac/terraform/main.tf`
- Create: `iac/terraform/variables.tf`
- Create: `iac/terraform/outputs.tf`
- Create: `iac/terraform/terraform.tfvars.example`
- Create: `iac/terraform/.gitignore`

- [ ] **Step 1: Create .gitignore**

```
*.tfvars
.terraform/
terraform.tfstate*
```

- [ ] **Step 2: Create variables.tf**

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "cognito_domain_prefix" {
  description = "Prefix for Cognito hosted UI domain"
  type        = string
  default     = "acaixinha-dev"
}

variable "s3_frontend_bucket_name" {
  description = "S3 bucket name for frontend hosting"
  type        = string
  default     = "acaixinha-dev-frontend"
}

variable "s3_media_bucket_name" {
  description = "S3 bucket name for media files"
  type        = string
  default     = "acaixinha-dev-media"
}

variable "dynamodb_users_table" {
  description = "DynamoDB table name for users"
  type        = string
  default     = "acaixinha-dev-users"
}

variable "dynamodb_memories_table" {
  description = "DynamoDB table name for memories"
  type        = string
  default     = "acaixinha-dev-memories"
}

variable "dynamodb_memory_shares_table" {
  description = "DynamoDB table name for memory shares"
  type        = string
  default     = "acaixinha-dev-memory-shares"
}

variable "cognito_callback_url" {
  description = "Cognito callback URL (set after CloudFront is created)"
  type        = string
  default     = "http://localhost:5173/callback"
}

variable "cognito_logout_url" {
  description = "Cognito logout URL"
  type        = string
  default     = "http://localhost:5173"
}
```

- [ ] **Step 3: Create main.tf (provider + terraform block)**

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  prefix     = "acaixinha-${var.environment}"
}
```

- [ ] **Step 4: Create outputs.tf (empty for now, populated after modules)**

```hcl
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
```

- [ ] **Step 5: Create terraform.tfvars.example**

```hcl
aws_region            = "eu-west-1"
cognito_domain_prefix = "acaixinha-dev"
cognito_callback_url  = "http://localhost:5173/callback"
cognito_logout_url    = "http://localhost:5173"
```

- [ ] **Step 6: Commit**

```bash
git add iac/terraform/
git commit -m "feat(iac): add Terraform base setup with variables and outputs"
```

---

### Task 2: S3 module

**Files:**
- Create: `iac/terraform/modules/s3/main.tf`
- Create: `iac/terraform/modules/s3/variables.tf`
- Create: `iac/terraform/modules/s3/outputs.tf`

- [ ] **Step 1: Create S3 variables.tf**

```hcl
variable "frontend_bucket_name" {
  description = "Name of the frontend hosting bucket"
  type        = string
}

variable "media_bucket_name" {
  description = "Name of the media storage bucket"
  type        = string
}
```

- [ ] **Step 2: Create S3 main.tf**

```hcl
resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket" "media" {
  bucket = var.media_bucket_name
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

- [ ] **Step 3: Create S3 outputs.tf**

```hcl
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
```

- [ ] **Step 4: Commit**

```bash
git add iac/terraform/modules/s3/
git commit -m "feat(iac): add S3 module (frontend + media buckets)"
```

---

### Task 3: CloudFront module

**Files:**
- Create: `iac/terraform/modules/cloudfront/main.tf`
- Create: `iac/terraform/modules/cloudfront/variables.tf`
- Create: `iac/terraform/modules/cloudfront/outputs.tf`

- [ ] **Step 1: Create CloudFront variables.tf**

```hcl
variable "frontend_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  type        = string
}

variable "frontend_bucket_id" {
  description = "S3 bucket ID for OAI"
  type        = string
}
```

- [ ] **Step 2: Create CloudFront main.tf**

```hcl
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.frontend_bucket_id}"
}

data "aws_cloudfront_cache_policy" "managed_caching_optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = var.frontend_bucket_regional_domain_name
    origin_id   = "S3-${var.frontend_bucket_id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    cache_policy_id        = data.aws_cloudfront_cache_policy.managed_caching_optimized.id
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-${var.frontend_bucket_id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
```

- [ ] **Step 3: Create CloudFront outputs.tf**

```hcl
output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}
```

- [ ] **Step 4: Commit**

```bash
git add iac/terraform/modules/cloudfront/
git commit -m "feat(iac): add CloudFront module for frontend hosting"
```

---

### Task 4: DynamoDB module

**Files:**
- Create: `iac/terraform/modules/dynamodb/main.tf`
- Create: `iac/terraform/modules/dynamodb/variables.tf`
- Create: `iac/terraform/modules/dynamodb/outputs.tf`

- [ ] **Step 1: Create DynamoDB variables.tf**

```hcl
variable "users_table_name" {
  description = "Users table name"
  type        = string
}

variable "memories_table_name" {
  description = "Memories table name"
  type        = string
}

variable "memory_shares_table_name" {
  description = "Memory shares table name"
  type        = string
}
```

- [ ] **Step 2: Create DynamoDB main.tf**

```hcl
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
```

- [ ] **Step 3: Create DynamoDB outputs.tf**

```hcl
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
```

- [ ] **Step 4: Commit**

```bash
git add iac/terraform/modules/dynamodb/
git commit -m "feat(iac): add DynamoDB module (users, memories, memory_shares)"
```

---

### Task 5: Cognito module

**Files:**
- Create: `iac/terraform/modules/cognito/main.tf`
- Create: `iac/terraform/modules/cognito/variables.tf`
- Create: `iac/terraform/modules/cognito/outputs.tf`

- [ ] **Step 1: Create Cognito variables.tf**

```hcl
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
```

- [ ] **Step 2: Create Cognito main.tf**

```hcl
resource "aws_cognito_user_pool" "main" {
  name = "acaixinha-dev-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }

  schema {
    name                = "preferred_username"
    attribute_data_type = "String"
    mutable             = true
    required            = false
  }

  alias_attributes = ["email", "preferred_username"]

  lambda_config {
    post_confirmation = var.post_confirmation_lambda_arn
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "acaixinha-dev-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_CUSTOM_AUTH",
  ]

  callback_urls = [var.callback_url]
  logout_urls   = [var.logout_url]

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "profile", "email"]
  allowed_oauth_flows_user_pool_client = true

  supported_identity_providers = ["COGNITO"]
}
```

- [ ] **Step 3: Create Cognito outputs.tf**

```hcl
output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "domain" {
  description = "Cognito domain prefix"
  value       = aws_cognito_user_pool_domain.main.domain
}
```

- [ ] **Step 4: Commit**

```bash
git add iac/terraform/modules/cognito/
git commit -m "feat(iac): add Cognito module (User Pool + App Client + Domain)"
```

---

### Task 6: IAM module

**Files:**
- Create: `iac/terraform/modules/iam/main.tf`
- Create: `iac/terraform/modules/iam/variables.tf`
- Create: `iac/terraform/modules/iam/outputs.tf`

- [ ] **Step 1: Create IAM variables.tf**

```hcl
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
```

- [ ] **Step 2: Create IAM main.tf**

```hcl
resource "aws_iam_role" "lambda_execution" {
  name = "acaixinha-dev-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "acaixinha-dev-lambda-dynamodb"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ]
        Resource = [
          var.users_table_arn,
          "${var.users_table_arn}/index/*",
          var.memories_table_arn,
          "${var.memories_table_arn}/index/*",
          var.memory_shares_table_arn,
          "${var.memory_shares_table_arn}/index/*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_s3" {
  name = "acaixinha-dev-lambda-s3"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
        ]
        Resource = [
          var.media_bucket_arn,
          "${var.media_bucket_arn}/*",
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_cognito" {
  name = "acaixinha-dev-lambda-cognito"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes",
        ]
        Resource = [var.user_pool_arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_execution.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "acaixinha-dev-api-gateway-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_logs" {
  role       = aws_iam_role.api_gateway_cloudwatch.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
```

- [ ] **Step 3: Create IAM outputs.tf**

```hcl
output "lambda_execution_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Lambda execution role name"
  value       = aws_iam_role.lambda_execution.name
}
```

- [ ] **Step 4: Commit**

```bash
git add iac/terraform/modules/iam/
git commit -m "feat(iac): add IAM module (Lambda execution role + API Gateway logging)"
```

---

### Task 7: Lambda module

**Files:**
- Create: `iac/terraform/modules/lambda/main.tf`
- Create: `iac/terraform/modules/lambda/variables.tf`
- Create: `iac/terraform/modules/lambda/outputs.tf`

- [ ] **Step 1: Create Lambda variables.tf**

```hcl
variable "role_arn" {
  description = "IAM role ARN for Lambda execution"
  type        = string
}

variable "users_table_name" {
  description = "DynamoDB users table"
  type        = string
}

variable "memories_table_name" {
  description = "DynamoDB memories table"
  type        = string
}

variable "memory_shares_table_name" {
  description = "DynamoDB memory shares table"
  type        = string
}

variable "s3_media_bucket_name" {
  description = "S3 media bucket"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito Client ID"
  type        = string
}

variable "source_dir" {
  description = "Path to built Lambda code"
  type        = string
  default     = "../../../apps/api/dist"
}
```

- [ ] **Step 2: Create Lambda main.tf**

```hcl
locals {
  env_vars = {
    DYNAMODB_TABLE_USERS         = var.users_table_name
    DYNAMODB_TABLE_MEMORIES      = var.memories_table_name
    DYNAMODB_TABLE_MEMORY_SHARES = var.memory_shares_table_name
    S3_BUCKET_NAME               = var.s3_media_bucket_name
    COGNITO_USER_POOL_ID         = var.cognito_user_pool_id
    COGNITO_CLIENT_ID            = var.cognito_client_id
    AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
  }

  lambdas = {
    # User lambdas
    "createUser"        = { handler = "user/infrastructure/lambdas/createUser.handler",        auth = false }
    "getUser"           = { handler = "user/infrastructure/lambdas/getUser.handler",           auth = true }
    "updateUserProfile" = { handler = "user/infrastructure/lambdas/updateUserProfile.handler", auth = true }
    "deleteUser"        = { handler = "user/infrastructure/lambdas/deleteUser.handler",        auth = true }

    # Memory lambdas
    "createMemory"     = { handler = "memory/infrastructure/lambdas/createMemory.handler",     auth = true }
    "getMemory"        = { handler = "memory/infrastructure/lambdas/getMemory.handler",        auth = true }
    "updateMemory"     = { handler = "memory/infrastructure/lambdas/updateMemory.handler",     auth = true }
    "deleteMemory"     = { handler = "memory/infrastructure/lambdas/deleteMemory.handler",     auth = true }
    "listMemories"     = { handler = "memory/infrastructure/lambdas/listMemories.handler",     auth = true }
    "searchMemories"   = { handler = "memory/infrastructure/lambdas/searchMemories.handler",   auth = true }
    "shareMemory"      = { handler = "memory/infrastructure/lambdas/shareMemory.handler",      auth = true }
    "unshareMemory"    = { handler = "memory/infrastructure/lambdas/unshareMemory.handler",    auth = true }
    "addAttachment"    = { handler = "memory/infrastructure/lambdas/addAttachment.handler",    auth = true }
    "removeAttachment" = { handler = "memory/infrastructure/lambdas/removeAttachment.handler", auth = true }

    # File lambdas
    "generateUploadUrl"   = { handler = "memory/infrastructure/lambdas/generateUploadUrl.handler",   auth = true }
    "generateDownloadUrl" = { handler = "memory/infrastructure/lambdas/generateDownloadUrl.handler", auth = true }
    "confirmAttachment"   = { handler = "memory/infrastructure/lambdas/confirmAttachment.handler",   auth = true }

    # Auth lambdas
    "postConfirmation" = { handler = "auth/infrastructure/lambdas/postConfirmation.handler", auth = false }
  }
}

data "archive_file" "lambda_code" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/lambda_code.zip"
}

resource "aws_lambda_function" "functions" {
  for_each = local.lambdas

  function_name = "acaixinha-dev-${each.key}"
  role          = var.role_arn
  handler       = each.value.handler
  runtime       = "nodejs22.x"
  filename      = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  memory_size = 256
  timeout     = 10

  environment {
    variables = local.env_vars
  }
}

resource "aws_lambda_permission" "api_gateway" {
  for_each = {
    for k, v in local.lambdas : k => v
    if v.auth || !v.auth
  }

  statement_id  = "AllowAPIGatewayInvoke-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*/*"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
```

- [ ] **Step 3: Create Lambda outputs.tf**

```hcl
output "function_arns" {
  description = "Map of Lambda function ARNs"
  value = {
    for k, v in aws_lambda_function.functions : k => v.arn
  }
}

output "function_names" {
  description = "Map of Lambda function names"
  value = {
    for k, v in aws_lambda_function.functions : k => v.function_name
  }
}

output "function_invoke_arns" {
  description = "Map of Lambda function invoke ARNs"
  value = {
    for k, v in aws_lambda_function.functions : k => v.invoke_arn
  }
}

output "post_confirmation_arn" {
  description = "Post-confirmation Lambda ARN"
  value       = aws_lambda_function.functions["postConfirmation"].arn
}

output "requires_auth" {
  description = "Map of Lambda keys that require Cognito auth"
  value = {
    for k, v in local.lambdas : k => v.auth
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add iac/terraform/modules/lambda/
git commit -m "feat(iac): add Lambda module (18 functions with shared env vars)"
```

---

### Task 8: API Gateway module

**Files:**
- Create: `iac/terraform/modules/api-gateway/main.tf`
- Create: `iac/terraform/modules/api-gateway/variables.tf`
- Create: `iac/terraform/modules/api-gateway/outputs.tf`

- [ ] **Step 1: Create API Gateway variables.tf**

```hcl
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
```

- [ ] **Step 2: Create API Gateway main.tf**

```hcl
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
```

- [ ] **Step 3: Create API Gateway outputs.tf**

```hcl
output "api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_url" {
  description = "API Gateway invoke URL"
  value       = "${aws_api_gateway_deployment.main.invoke_url}${aws_api_gateway_stage.v1.stage_name}"
}

output "api_execution_arn" {
  description = "API Gateway execution ARN prefix"
  value       = aws_api_gateway_deployment.main.execution_arn
}
```

- [ ] **Step 4: Commit**

```bash
git add iac/terraform/modules/api-gateway/
git commit -m "feat(iac): add API Gateway module (17 endpoints + Cognito authorizer + CORS)"
```

---

### Task 9: Main.tf wiring all modules

**Files:**
- Modify: `iac/terraform/main.tf` (add module blocks)

- [ ] **Step 1: Update main.tf with all module calls**

Append this to the existing `iac/terraform/main.tf`:

```hcl
module "s3" {
  source = "./modules/s3"

  frontend_bucket_name = var.s3_frontend_bucket_name
  media_bucket_name    = var.s3_media_bucket_name
}

module "cloudfront" {
  source = "./modules/cloudfront"

  frontend_bucket_regional_domain_name = module.s3.frontend_bucket_regional_domain_name
  frontend_bucket_id                   = module.s3.frontend_bucket_id
}

module "dynamodb" {
  source = "./modules/dynamodb"

  users_table_name         = var.dynamodb_users_table
  memories_table_name      = var.dynamodb_memories_table
  memory_shares_table_name = var.dynamodb_memory_shares_table
}

module "cognito" {
  source = "./modules/cognito"

  domain_prefix                 = var.cognito_domain_prefix
  callback_url                  = var.cognito_callback_url
  logout_url                    = var.cognito_logout_url
  post_confirmation_lambda_arn  = module.lambda.post_confirmation_arn
}

module "iam" {
  source = "./modules/iam"

  users_table_arn          = module.dynamodb.users_table_arn
  memories_table_arn       = module.dynamodb.memories_table_arn
  memory_shares_table_arn  = module.dynamodb.memory_shares_table_arn
  media_bucket_arn         = module.s3.media_bucket_arn
  user_pool_arn            = module.cognito.user_pool_arn
}

module "lambda" {
  source = "./modules/lambda"

  role_arn                 = module.iam.lambda_execution_role_arn
  users_table_name         = module.dynamodb.users_table_name
  memories_table_name      = module.dynamodb.memories_table_name
  memory_shares_table_name = module.dynamodb.memory_shares_table_name
  s3_media_bucket_name     = var.s3_media_bucket_name
  cognito_user_pool_id     = module.cognito.user_pool_id
  cognito_client_id        = module.cognito.client_id
}

module "api_gateway" {
  source = "./modules/api-gateway"

  lambda_invoke_arns     = module.lambda.function_invoke_arns
  function_names         = module.lambda.function_names
  requires_auth          = module.lambda.requires_auth
  cognito_user_pool_arn  = module.cognito.user_pool_arn
  region                 = local.region
  account_id             = local.account_id
}
```

- [ ] **Step 2: Commit**

```bash
git add iac/terraform/main.tf
git commit -m "feat(iac): wire all Terraform modules in main.tf"
```

---

### Task 10: Verification

**Files:**
- None new. Verification only.

- [ ] **Step 1: Run terraform init**

```bash
cd iac/terraform && terraform init
```
Expected: Initializes successfully, downloads AWS provider.

- [ ] **Step 2: Run terraform fmt**

```bash
cd iac/terraform && terraform fmt -recursive
```
Expected: No formatting changes needed.

- [ ] **Step 3: Run terraform validate**

```bash
cd iac/terraform && terraform validate
```
Expected: "Success! The configuration is valid."

- [ ] **Step 4: Commit any format fixes**

```bash
git add iac/terraform/
git commit -m "chore(iac): terraform fmt and validation fixes"