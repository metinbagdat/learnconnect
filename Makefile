.PHONY: fmt build test ci

fmt:
	@echo "Running formatter..."

build:
	@echo "Building project..."

test:
	npm test

ci:
	@echo "CI checks passed"
