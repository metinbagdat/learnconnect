.PHONY: fmt build test ci

fmt:
	gofmt -s -w .

build:
	go build ./...

test:
	go test ./...

ci: fmt build test
