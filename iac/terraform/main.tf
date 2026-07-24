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

  domain_prefix                = var.cognito_domain_prefix
  callback_url                 = var.cognito_callback_url
  logout_url                   = var.cognito_logout_url
  post_confirmation_lambda_arn = module.lambda.post_confirmation_arn
}

module "iam" {
  source = "./modules/iam"

  users_table_arn         = module.dynamodb.users_table_arn
  memories_table_arn      = module.dynamodb.memories_table_arn
  memory_shares_table_arn = module.dynamodb.memory_shares_table_arn
  media_bucket_arn        = module.s3.media_bucket_arn
  user_pool_arn           = module.cognito.user_pool_arn
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

  lambda_invoke_arns    = module.lambda.function_invoke_arns
  function_names        = module.lambda.function_names
  requires_auth         = module.lambda.requires_auth
  cognito_user_pool_arn = module.cognito.user_pool_arn
  region                = local.region
  account_id            = local.account_id
}