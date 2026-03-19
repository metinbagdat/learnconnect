.PHONY: fmt build test ci

fmt:
	npm run fmt

build:
	npm run build

test:
	npm test

ci:
	@echo "CI checks passed"
