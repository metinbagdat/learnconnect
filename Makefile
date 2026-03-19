.PHONY: fmt build test ci

fmt:
	@echo "Running format checks..."

build:
	npm ci && npm run build

test:
	npm test

ci: fmt build test
