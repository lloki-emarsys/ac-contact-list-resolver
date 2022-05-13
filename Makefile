.PHONY: dev verify lint lint-fix types depcheck test watch-test trigger-load-request
.PHONY: start-dev-services stop-dev-services restart-dev-services test-coverage

ifneq (,$(wildcard ./.env))
    include .env
    export
endif

NODE_DEPS=node_modules
BIN=$(NODE_DEPS)/.bin
TSC=$(BIN)/tsc
DIST=dist

default: $(DIST)

verify: types lint test-coverage

$(TSC): package.json yarn.lock
	yarn --immutable --frozen-lockfile --ignore-scripts --non-interactive \
		&& touch $(TSC)

$(DIST): $(TSC)
	$(TSC) -p ./src --pretty

# .env: .env.development
# 	cp .env.development .env

dev: $(TSC)
	$(BIN)/nodemon dev/dev-runner.ts

# dev: start-dev-services $(TSC)
# 	$(BIN)/concurrently \
# 		-n worker,graphql \
# 		-c bgBlue,bgMagenta \
# 		"WATCH_FILE=./dev/worker/dev-runner.ts $(BIN)/nodemon" \
# 		"WATCH_FILE=./dev/graphql/dev-runner.ts $(BIN)/nodemon"

watch-test: $(TSC)
	$(BIN)/jest --watch

test: $(TSC)
	$(BIN)/jest --verbose

test-coverage: $(TSC)
	$(BIN)/jest --verbose --coverage

types: $(TSC)
	$(BIN)/tsc --noEmit -p .

lint: $(TSC)
	$(BIN)/eslint .

lint-fix: $(TSC)
	$(BIN)/eslint . --fix

depcheck: $(TSC)
	$(BIN)/depcheck --ignores="depcheck,nodemon"

deploy-worker:
	DEPLOY_SERVICE=worker ./deploy.sh

deploy-graphql:
	DEPLOY_SERVICE=graphql ./deploy.sh

trigger-load-request: $(TSC)
	$(BIN)/ts-node dev/worker/trigger-load-request.ts

purge-queue: $(TSC)
	$(BIN)/ts-node dev/worker/purge-queue.ts

start-dev-services:
	docker compose up -d

stop-dev-services:
	docker compose stop

restart-dev-services: stop-dev-services start-dev-services

before-commit: lint-fix verify
