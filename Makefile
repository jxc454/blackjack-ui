COMMIT=$(shell git rev-parse --short=7 HEAD)
ECR=$(shell aws sts get-caller-identity --query Account --output text)

.PHONY: build
build:
	npm run build && docker build \
		-t $(ECR).dkr.ecr.us-east-1.amazonaws.com/blackjack-ui:$(COMMIT) \
		-t $(ECR).dkr.ecr.us-east-1.amazonaws.com/blackjack-ui:latest \
		.

.PHONY: push
push:
	docker push $(ECR).dkr.ecr.us-east-1.amazonaws.com/blackjack-ui:$(COMMIT) && \
	docker push $(ECR).dkr.ecr.us-east-1.amazonaws.com/blackjack-ui:latest

