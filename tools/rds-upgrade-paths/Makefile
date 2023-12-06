I := "⚪"
E := "🔴"

.PHONY: lint
lint: $(GO_LINTER)
	@echo "$(I) installing dependencies..."
	@go get ./... || (echo "$(E) 'go get' error"; exit 1)
	@echo "$(I) updating imports..."
	@go mod tidy || (echo "$(E) 'go mod tidy' error"; exit 1)
	@echo "$(I) vendoring..."
	@go mod vendor || (echo "$(E) 'go mod vendor' error"; exit 1)
	@echo "$(I) linting..."
	@golangci-lint run ./... || (echo "$(E) linter error"; exit 1)
	$(MAKE) test

GO_LINTER := $(GOPATH)/bin/golangci-lint
$(GO_LINTER):
	@echo "installing linter..."
	@go get -u github.com/golangci/golangci-lint/cmd/golangci-lint || (echo "$(E) linter installation error"; exit 1)
