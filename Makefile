.PHONY: install dev dev-api dev-web build lint lint-fix format format-check \
	typecheck test test-api test-web test-coverage test-integration test-e2e \
	dynamodb-up dynamodb-down clean setup

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
	rm -rf .terraform

setup: install build