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