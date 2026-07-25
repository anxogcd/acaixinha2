.PHONY: install dev dev-api dev-web build lint lint-fix format format-check \
	typecheck test test-api test-web test-coverage test-integration test-e2e \
	dynamodb-up dynamodb-down clean setup \
	terraform-init terraform-plan terraform-apply terraform-destroy \
	terraform-fmt terraform-fmt-check terraform-validate terraform-output \
	terraform-refresh terraform-console terraform-state-list terraform-setup

install:
	pnpm install

dev:
	pnpm dev

dev-api:
	pnpm --filter @acaixinha/api dev

dev-web:
	pnpm --filter @acaixinha/web dev

build:
	pnpm build

lint:
	pnpm lint

lint-fix:
	pnpm lint:fix

format:
	pnpm format

format-check:
	pnpm format:check

typecheck:
	pnpm typecheck

test:
	pnpm --filter @acaixinha/api test && pnpm --filter @acaixinha/web test

test-api:
	pnpm --filter @acaixinha/api test

test-web:
	pnpm --filter @acaixinha/web test

test-coverage:
	pnpm --filter @acaixinha/api test:coverage

test-integration:
	pnpm --filter @acaixinha/api test:integration

test-e2e:
	pnpm --filter @acaixinha/web test:e2e

dynamodb-up:
	docker compose -f docker/dynamodb-local.yml up -d

dynamodb-down:
	docker compose -f docker/dynamodb-local.yml down

clean:
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/*/dist packages/*/dist
	rm -rf $(TF_DIR)/.terraform

setup: install build

TF_DIR := iac/terraform

terraform-setup:
	@if [ ! -f $(TF_DIR)/terraform.tfvars ]; then \
		cp $(TF_DIR)/terraform.tfvars.example $(TF_DIR)/terraform.tfvars; \
		echo "Created terraform.tfvars from example"; \
	else \
		echo "terraform.tfvars already exists"; \
	fi

terraform-init:
	terraform -chdir=$(TF_DIR) init

terraform-plan:
	terraform -chdir=$(TF_DIR) plan

terraform-apply:
	terraform -chdir=$(TF_DIR) apply

terraform-destroy:
	terraform -chdir=$(TF_DIR) destroy

terraform-fmt:
	terraform -chdir=$(TF_DIR) fmt -recursive

terraform-fmt-check:
	terraform -chdir=$(TF_DIR) fmt -recursive -check

terraform-validate:
	terraform -chdir=$(TF_DIR) validate

terraform-output:
	terraform -chdir=$(TF_DIR) output

terraform-refresh:
	terraform -chdir=$(TF_DIR) refresh

terraform-console:
	terraform -chdir=$(TF_DIR) console

terraform-state-list:
	terraform -chdir=$(TF_DIR) state list